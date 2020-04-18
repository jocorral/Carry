const mongoose = require('mongoose');
const establishmentSchema = new mongoose.Schema({
    // _id : mongoose.Schema.Types.ObjectId,
    name : String,
    phoneNumber : Number,
    location : String
});

module.exports = mongoose.model('Establishment', establishmentSchema);