const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    id: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true, default: '/icon.png' },
    tokens: { type: Array, required: true, default: [] },
    placeTimeOut: { type: Number, required: true, default: 3 },
    joinDate: { type: Number, required: true, default: Date.now() },
    stats: {
        enabled: { type: Boolean, required: true, default: true },
        blocksPlaced: { type: Number, required: true, default: 0 },
        level: { type: Number, required: true, default: 0 },
        xp: { type: Number, required: true, default: 0 },
        online: { type: Boolean, required: true, default: false }
    },
    last: {
        selected: {
            x: { type: Number, required: true, default: 0 },
            y: { type: Number, required: true, default: 0 },
            colour: { type: String, required: true, default: '26853' }
        },
        placed: { type: String, required: true, default: '000' },
        placeDate: { type: Number, required: true, default: 1650218757806 },
    },
    reddit: {
        public: { type: Boolean, required: true, default: false },
        id: { type: String, required: true, default: '0000' },
        employee: { type: Boolean, required: true, default: false },
        username: { type: String, required: true, default: 'me' }
    },
    discord: {
        public: { type: Boolean, required: true, default: false },
        id: { type: String, required: true, default: '0000' },
        discriminator: { type: String, required: true, default: '0000' },
        username: { type: String, required: true, default: 'me' }
    },
    additionalColours: { type: Boolean, required: true, default: false },
    admin: { type: Boolean, required: true, default: false }
}, { versionKey: false });

module.exports = model('user', UserSchema);