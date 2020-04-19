const mongoose = require('mongoose');
const order = mongoose.Schema({
    //_id : mongoose.Schema.Types.ObjectId,
    totalCost : {type:Number, required: true},
    orderDate : {type:String, required: true},
    orderTime : {type:String, required: true},
    rating : {type:Int32Array},
    userEmail : {type:String, required: true},
    status : {type:String, required: true},
    establishmentId : {type: mongoose.Schema.Types.ObjectId, ref:'Establishment', required: true}
});

module.exports = Order = mongoose.model('order', order);