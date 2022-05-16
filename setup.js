require('dotenv').config();
const mongoose = require('mongoose');
const BlockSchema = require('./database/schemas/block');
const UserSchema = require('./database/schemas/user');
const DataSchema = require('./database/schemas/data');
const ColourSchema = require('./database/schemas/colour');
var uuid = require('uuid').v4;

mongoose.connect(process.env.dbURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(async(result) => {
    console.log("connected to database");


    UserSchema.create({
        id: '0',
        username: 'server',
        avatar: '/icon.png',
        tokens: [],
        stats: {
            enabled: false,
            blocksPlaced: 0,
            level: 0,
            xp: 0
        },
        last: {
            selected: {
                x: 0,
                y: 0,
                colour: '#FFFFFF'
            },
            placed: '000',
            placeDate: Date.now(),
        },
        reddit: {
            id: '0000',
            employee: false,
            username: 'place'
        },
        discord: {
            id: '0000',
            discriminator: '0000',
            username: 'place'
        },
        additionalColours: true,
        admin: true
    })

    var blocks = [ /* a humongous amount of potato objects */ ];
    //do y
    let y = 0;
    for (let i = 0; i < parseFloat(100); i++) {
        //do x
        let xc = 0
        for (let x = 0; x < parseFloat(250); x++) {
            let id = uuid();
            blocks.push({
                id: id,
                y: y,
                x: xc,
                colour: '#FFFFFF',
                user: '0',
                date: Date.now()
            });
            //console.log("gen block: " + id);
            xc += 5;
        }
        y += 5;
    }

    BlockSchema.collection.insertMany(blocks, onInsert);
    console.log("starting insertion of " + blocks.length + ' blocks')

    function onInsert(err, docs) {
        if (err) {
            // TODO: handle error
            console.log(err.stack || err)
        } else {
            console.info('%d blocks were successfully stored.', docs.length);
        }
    }


    ColourSchema.create({
        id: uuid(),
        value: '#656fe4',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#7964e4',
        additional: false
    });


    ColourSchema.create({
        id: '26853',
        value: '#FFFFFF',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#E4E4E4',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#888888',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#222222',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#E50000',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#E59500',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#A06A42',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#E5D900',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#94E044',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#02BE01',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#00D3DD',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#0083C7',
        additional: false
    });
    ColourSchema.create({
        id: uuid(),
        value: '#0000EA',
        additional: false
    });

    ColourSchema.create({
        id: uuid(),
        value: '#000000',
        additional: true
    });

    DataSchema.create({
        id: 'signup',
        values: [{
            date: Date.now(),
            type: 'system'
        }]
    });
    DataSchema.create({
        id: 'login',
        values: [{
            date: Date.now(),
            type: 'system'
        }]
    });
    DataSchema.create({
        id: 'activeusers',
        values: [{
            date: Date.now(),
            no: 0
        }]
    });
}).catch((error) => {
    console.log(error.stack || error);
});


const snfl = () => {
    const date = Date.now().toString()
    const genS1 = Math.floor(Math.random() * parseInt(Math.random() * 4))
    const genS2 = Math.floor(Math.random() * parseInt(Math.random() * 4))
    const genS3 = Math.floor(Math.random() * parseInt(Math.random() * 4))
    const genS4 = Math.floor(Math.random() * parseInt(Math.random() * 4))
    var middle = Math.floor(date.length / 2)
    var s1 = date.substr(0, middle)
    var s2 = date.substr(middle + 1)
    return genS1 + s1 + genS2 + s2 + genS3 + genS4
}