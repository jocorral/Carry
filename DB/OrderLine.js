const mongoose = require('mongoose');
const orderLine = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    amount : Number,
    orderId : {type: mongoose.Schema.Types.ObjectId, ref:'Order', required: true},
    dishId : {type: mongoose.Schema.Types.ObjectId, ref:'Dish', required: true}
});

module.exports = OrderLine = mongoose.model('orderLine', orderLine);