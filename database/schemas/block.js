const { Schema, model } = require('mongoose');

const BlockSchema = new Schema({
    id: { type: String, required: true },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    colour: { type: String, required: true, default: '#FFFFFF' },
    user: { type: String, required: true, default: '0' },
    date: { type: Number, required: true, default: Date.now() },
    locked: { type: Boolean, required: true, default: false }
}, { versionKey: false });

module.exports = model('block', BlockSchema);
