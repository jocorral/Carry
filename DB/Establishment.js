const mongoose = require('mongoose');
const establishmentSchema = new mongoose.Schema({
    // _id : mongoose.Schema.Types.ObjectId,
    name : {type:String},
    phoneNumber : {type:Number},
    location : {type:String}
});

module.exports = mongoose.model('Establishment', establishmentSchema);