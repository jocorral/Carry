const mongoose = require('mongoose');
const pedido = new mongoose.Schema({
    precio : {
        type:Number
    },
    fechaPedidoRealizado : {
        type:Date
    },
    fechaRecepcionPedido : {
        type:Date
    },
    valoracion : {
        type:Number
    }
});

module.exports = Pedido = mongoose.model('pedido', pedido);