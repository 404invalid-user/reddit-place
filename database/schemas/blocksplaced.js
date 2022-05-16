const { Schema, model } = require('mongoose');

const BlockSchema = new Schema({
    id: { type: String, required: true },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    colour: { type: String, required: true, default: '#FFFFFF' },
    date: { type: Number, required: true, default: Date.now() }
}, { versionKey: false });

module.exports = model('blocksplaced', BlockSchema);