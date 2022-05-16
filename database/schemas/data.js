const { Schema, model } = require('mongoose');

const DataSchema = new Schema({
    id: { type: String, required: true },
    values: { type: Array, required: true, default: [] }
}, { versionKey: false });

module.exports = model('data', DataSchema);