const mongoose = require('mongoose');
const order = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    totalCost : Number,
    orderDate : Date,
    orderTime : String,
    rating : Number,
    userEmail : String,
    status : String,
    establishmentId : {type: mongoose.Schema.Types.ObjectId, ref:'Establishment', required: true}
});

module.exports = Order = mongoose.model('order', order);