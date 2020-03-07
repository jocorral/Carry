const mongoose = require('mongoose');
const pedido = new mongoose.Schema({
    numeroPedido : {
        type:String
    }
});

module.exports = Pedido = mongoose.model('pedido', pedido);