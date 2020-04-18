const mongoose = require('mongoose');
const orderLineList = mongoose.Schema({
    //_id : mongoose.Schema.Types.ObjectId,
    data : {type:Array, required: true}
});

module.exports = mongoose.model('OrderLineList', orderLineList);