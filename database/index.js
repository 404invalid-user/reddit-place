const mongoose = require('mongoose');
const Redis = require('ioredis');
const util = require("util");
const BlockSchema = require('./schemas/block');
const UserSchema = require('./schemas/user');
const DataSchema = require('./schemas/data');
const ColourSchema = require('./schemas/colour');
let redisclient;

module.exports.connect = () => {
    return new Promise(async(resolve, reject) => {
        console.log("connecitng to db");
        await mongoose.connect(process.env.dbURI, { useNewUrlParser: true, useUnifiedTopology: true }).then((result) => {
            console.log("connected to database");
        }).catch((error) => {
            console.log(error.stack || error);
        });

        const redisDetails = process.env.REDIS.split(':')
        redisclient = new Redis({
            password: redisDetails.length == 3 ? redisDetails[0] : null,
            host: redisDetails.length == 3 ? redisDetails[1] : redisDetails[0],
            port: redisDetails.length == 3 ? redisDetails[2] : redisDetails[1],
            db: parseInt(process.env.REDIS.split('/')[1])
        });
        await redisclient.flushdb(async() => {
            console.log(`Flushing Redis -`);
            console.log('Started caching the databases');
            //cache canvas blocks
            let cdblocks = 0;
            const blocks = await BlockSchema.find({});
            console.log(`Caching ${blocks.length} blocks`);
            for (const block of blocks) {
                await redisclient.hset('block', block.id, JSON.stringify(block));
                cdblocks++;
                if (cdblocks == blocks.length - 1) {
                    console.log("cached all blocks")
                }
            }
            //cache users
            const users = await UserSchema.find({});
            console.log(`Caching ${users.length} users`);
            for (const user of users) {
                redisclient.hset('user', user.id, JSON.stringify(user));
            }

            const datas = await DataSchema.find();
            console.log(`caching ${datas.length} datas`);
            for (const data of datas) {
                redisclient.hset('data', data.id, JSON.stringify(data));
            }
            const colours = await ColourSchema.find();
            console.log(`caching ${colours.length} colours`);
            for (const colour of colours) {
                redisclient.hset('colours', colour.id, JSON.stringify(colour));
            }

            redisclient.hget = util.promisify(redisclient.hget);
            redisclient.hgetall = util.promisify(redisclient.hgetall);
            console.log('cached the databases');
            resolve();
        });


    })
}


module.exports.cache = {
    async lookup(collection, key) {
        // collection can be 'server' or 'user'
        const cacheValue = await redisclient.hget(collection, key);
        var result = null

        if (cacheValue) {
            result = JSON.parse(cacheValue);
        }

        // Mongo fallback
        else {
            console.log(`${key} just fellback to mongo while looking for the ${collection} collection!`)
            if (collection == 'block') {
                result = await BlockSchema.findOne({ id: key });
                if (result != null) {
                    redisclient.hset(collection, key, JSON.stringify(result))
                }
            } else if (collection == 'user') {
                result = await UserSchema.findOne({ id: key });
                if (result != null) {
                    redisclient.hset(collection, key, JSON.stringify(result))
                }
            } else if (collection == 'data') {
                result = await DataSchema.findOne({ id: key });
                if (result != null) {
                    redisclient.hset(collection, key, JSON.stringify(result))
                }
            } else if (collection == 'colours') {
                result = await ColourSchema.findOne({ id: key });
                if (result != null) {
                    redisclient.hset(collection, key, JSON.stringify(result))
                }
            } else {
                console.log(`${collection} is not a valid collection name - block, user!`)
                return
            }
        }
        if (result !== null) {
            result['save'] = async() => {
                var mdbupdate
                if (collection == 'block') {
                    mdbupdate = await BlockSchema.findOne({ id: key });
                } else if (collection == 'user') {
                    mdbupdate = await UserSchema.findOne({ id: key });
                } else if (collection == 'data') {
                    mdbupdate = await DataSchema.findOne({ id: key });
                } else if (collection == 'colours') {
                    mdbupdate = await ColourSchema.findOne({ id: key });
                } else {
                    throw `${collection} is not a valid collection name!`
                }
                for (const o in result) {
                    if (result.hasOwnProperty(o)) {
                        if (o !== 'save') {
                            mdbupdate[o] = result[o];
                        }
                    }
                }
                await mdbupdate.save();
                await redisclient.hdel(collection, key);
                await redisclient.hset(collection, key, JSON.stringify(mdbupdate));
                return true;
            }
        }
        return result;
    },
    async getall(collection) {
        const items = await redisclient.hgetall(collection);
        return Reflect.ownKeys(items).map((key) => JSON.parse(items[key]));
    },
    async lookupBlockid(x, y) {
        const all = await module.exports.cache.getall('block');
        let id = null;
        for (const block of all) {
            if (block.x == x && block.y == y) {
                id = block.id;
            }
        };
        return id;
    },
    // Create a Redis cache document
    async create(collection, key, value) {
        redisclient.hset(collection, key, JSON.stringify(value));
    },

    // Remove document from redis
    // collection has to be 'Server' or 'Log'
    remove(collection, key) {
        redisclient.hdel(collection, key);
    },

}
