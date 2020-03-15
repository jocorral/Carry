const express = require('express');
const router = express.Router();
const Pedido = require('../DB/Pedido');


router.get('/', (req, res) => {
    res.send('Estamos en los pedidos 2.');
});


router.post('/', async(req, res) => {
    const pedido = new Pedido({        
        precio:req.body.precio,
        fechaPedidoRealizado:req.body.fechaPedidoRealizado,
        fechaRecepcionPedido:req.body.fechaRecepcionPedido,
        valoracion:req.body.valoracion
    });

    try{
        const savedPedido = await pedido.save();
        res.json(savedPedido);
       
    }
    catch(err) {
        console.error(err);
        res.json({ message:err });
    }
});

module.exports = router;