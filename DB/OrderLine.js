const mongoose = require('mongoose');
const orderLine = mongoose.Schema({
    //_id : mongoose.Schema.Types.ObjectId,
    amount : {type:Number, required: true},
    orderId : {type: mongoose.Schema.Types.ObjectId, ref:'Order', required: true},
    dishId : {type: mongoose.Schema.Types.ObjectId, ref:'Dish', required: true}
});

module.exports = mongoose.model('OrderLine', orderLine);