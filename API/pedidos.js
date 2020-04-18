const express = require('express');
const router = express.Router();
const Order = require('../DB/Order');


router.get('/', (req, res) => {
    res.send('Estamos en los pedidos 2.');
});


router.post('/', async(req, res) => {
    const pedido = new Order({        
        totalCost : req.body.totalCost,
        orderDate : req.body.orderDate,
        orderTime : req.body.orderTime,
        rating : req.body.rating,
        userEmail : req.body.userEmail
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