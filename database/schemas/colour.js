const { Schema, model } = require('mongoose');

const BlockSchema = new Schema({
    id: { type: String, required: true },
    value: { type: String, required: true, default: '#FFFFFF' },
    additional: { type: Boolean, required: true, default: false }
}, { versionKey: false });

module.exports = model('colour', BlockSchema);