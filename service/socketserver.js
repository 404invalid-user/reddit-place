const cache = require('../database/index').cache;
const BlocksplacedSchema = require('../database/schemas/blocksplaced')
module.exports = async(io) => {
    let users = await cache.lookup('data', 'activeusers');
    //reset users on start up
    users.values.push({
        date: Date.now(),
        no: 0
    });
    users.save();
    await io.use(async(socket, next) => {
        socket.user = null;
        if (!socket.handshake || !socket.handshake.auth || !socket.handshake.auth.id || !socket.handshake.auth.token) return next();
        const currentUser = await cache.lookup('user', socket.handshake.auth.id).catch((e) => {});
        if (currentUser == null) return next();
        let hasAccess = false;
        for await (const token of currentUser.tokens) {
            if (socket.handshake.auth.token == token.code) {
                hasAccess = true;
            }
        }
        if (hasAccess) {
            socket.user = await currentUser;
            return next();
        }
        return next();
    });




    io.on('connection', async(socket) => {
        //make user statatus online
        if (socket.user) {
            socket.user.stats.online = true;
            socket.user.save();
        }
        //update active users data
        users.values.push({
            date: Date.now(),
            no: (users.values[users.values.length - 1].no + 1)
        });
        users.save();
        socket.on('disconnect', async() => {
            //make user status offline
            if (socket.user) {
                socket.user.stats.online = false;
                socket.user.save();
            }
            //update active users data
            users.values.push({
                date: Date.now(),
                no: (users.values[users.values.length - 1].no - 1)
            });
            users.save();
        });

        socket.on('select', async(data) => {
            if (socket.user == null) return socket.emit('login');

            const colour = await cache.lookup('colours', data.colour);
            if (colour == null) return socket.emit('option-error', { error: 'invalid colour selected' });

            if (colour.additional && !socket.user.additionalColours) return socket.emit('option-error', { error: 'you need additionalColours perm to select this' });
            socket.user.last.selected = {
                x: data.x,
                y: data.y,
                colour: data.colour
            };
            await socket.user.save();
            updateUser(socket);
        })

        socket.on('place', async(data) => {
            if (socket.user == null) return socket.emit('login');
            if (socket.user.last.placeDate + (socket.user.placeTimeOut * 60000) > Date.now()) return console.log("need more tim");

            //update block
            const blockid = await cache.lookupBlockid(data.x, data.y);
            if (blockid == null) return console.log("no block id");
            const block = await cache.lookup('block', blockid);
            if (block == null) return console.log("no block");

            //get colour
            const colour = await cache.lookup('colours', data.colour);
            if(!colour || colour ==null) return;
            if (colour.additional && !socket.user.additionalColours) return console.log("no colour");;
            block.colour = colour.value;
            block.user = socket.user.id;
            block.save();


            //update user placed blocks info
            socket.user.last.blockPlaced = block.id;
            socket.user.last.placeDate = Date.now();

            socket.user.stats.blocksPlaced++;
            BlocksplacedSchema.create({
                id: socket.user.id,
                x: block.x,
                y: block.y,
                colour: block.colour,
                date: Date.now()
            });

            //add user xp and levels
            if (socket.user.stats.enabled) {
                socket.user.stats.xp = calculatexp(socket.user.stats.blocksPlaced);
                if (socket.user.stats.xp >= 100) {
                    socket.user.stats.xp = 0;
                    socket.user.stats.level++;
                }
            }
            await socket.user.save();

            updateUser(socket)
            io.emit('place-block', block);
        });

    });
}


function updateUser(socket) {
    socket.emit('update-user', {
        id: socket.user.id,
        discord: socket.user.discord,
        reddit: socket.user.reddit,
        username: socket.user.usernmae,
        avatar: socket.user.avatar,
        tokens: [],
        last: socket.user.last,
        additionalColours: socket.user.additionalColours,
        admin: socket.user.admin,
        placeTimeOut: socket.user.placeTimeOut
    });
}


function calculatexp() {
    return Math.floor(Math.random() * 23);
}