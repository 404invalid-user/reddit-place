const path = require('path');
const express = require('express');
const cache = require('../database/index').cache;
const UserScema = require('../database/schemas/user')
module.exports = (app, client) => {
    app.use((req, res, next) => {
        req.date = Date.now();
        next();
    });
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(__dirname + '/../www'));
    app.use((req, res, next) => {
        const {
            headers: { cookie }
        } = req;
        if (cookie) {
            const values = cookie.split(';').reduce((res, item) => {
                const data = item.trim().split('=')
                return {...res, [data[0]]: data[1] }
            }, {});
            req.cookies = values;
        } else req.cookies = {};
        next();
    });
    app.use(async(req, res, next) => {
        req.user = null;
        if (!req.cookies.id || !req.cookies.token) return next();
        const currentUser = await cache.lookup('user', req.cookies.id).catch((e) => {});
        if (currentUser == null) return next();
        if (currentUser.tokens.filter(t => t.code == req.cookies.token).length > 0) {
            req.user = await currentUser;
            return next();
        }
        return next();
    });

    //general
    app.get('/leaderboard', (req, res) => res.sendFile(path.join(__dirname + '/../www', '/leaderboard.html')));
    app.get('/about', (req, res) => res.sendFile(path.join(__dirname + '/../www', '/about.html')));
    app.get('/settings', (req, res) => res.sendFile(path.join(__dirname + '/../www', '/settings.html')));

    //login
    app.get('/login', (req, res) => res.sendFile(path.join(__dirname + '/../www', '/login.html')));
    app.get('/login/reddit', (req, res) => require('../get/login-reddit').run(client, req, res));
    app.get('/login/discord', (req, res) => require('../get/login-discord').run(client, req, res));


    //admin
    app.get('/admin/stats.png', (req, res) => require('../get/admin-stats.png.js').run(client, req, res));

    app.get('/admin/userlookup', async(req, res) => {
        console.log(req.query.id)
        if (!req.user.admin) return res.status(403);
        const user = await cache.lookup('user', req.query.id);
        if (user == null) console.log("unumll")
        let senuser = user;
        senuser.tokens = undefined;
        res.json(senuser);
    })

    //api
    app.get('/api/blocks', async(req, res) => {
        const allBlocks = await cache.getall('block');
        return res.send(JSON.stringify(allBlocks));
    });

    app.get('/api/me', async(req, res) => {
        if (req.user == null) {
            return res.json({
                id: '1',
                username: 'me',
                avatar: '/icon.png',
                stats: {
                    enabled: true,
                    blocksPlaced: 0,
                    level: 0,
                    xp: 0,
                },
                last: {
                    selected: {
                        x: 0,
                        y: 0,
                        colour: '#FFFFFF'
                    },
                    placed: '0000',
                    placeDate: 1650218757806,
                },
                reddit: {
                    id: '0000',
                    employee: false,
                    username: 'me'
                },
                discord: {
                    id: '0000',
                    discriminator: '0000',
                    username: 'me'
                },
                additionalColours: false,
                admin: false,
                placeTimeOut: 3
            });
        }
        const me = req.user;
        me.tokens = undefined;
        return res.json(me);
    });

    app.get('/api/activeusers', async(req, res) => {
        const users = await cache.lookup('data', 'activeusers');
        res.json({
            users: users.values[users.values.length - 1].no
        });
    })

    app.get('/api/leaderboard', async(req, res) => {
        const users = await UserScema.find().sort({ "stats.level": -1 }).limit(10);
        const topTenUsers = [];
        for (const user of users) {
            const commonColour = await getUserCommonColour(user.id);
            topTenUsers.push({
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                level: user.stats.level,
                xp: user.stats.xp,
                blocksPlaced: user.stats.blocksPlaced,
                commonColour: commonColour,
                discord: {
                    username: user.discord.username,
                    discriminator: user.discord.discriminator
                },
                reddit: user.reddit.username,
                joinDate: user.joinDate,
                admin: user.admin,
                online: user.stats.online
            });
        };
        res.json(topTenUsers);
    })

    app.get('/api/colours', async(req, res) => {
        const colours = await cache.getall('colours');
        return res.json(colours);
    });


    app.post('/api/me', (req, res) => {
        if (req.user == null) returnres.status(401).send();

        req.user.discord.public = req.body.discordPublic ? true : false;
        req.user.reddit.public = req.body.redditPublic ? true : false;
        req.user.save();
    });



};
const getUserCommonColour = (userid) => {
    return null;
}
