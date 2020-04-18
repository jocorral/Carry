const express = require('express');
const router = express.Router();
const Order = require('../DB/Order');
const OrderLine = require('../DB/OrderLine');
const OrderLineList = require('../DB/OrderLineList');


router.get('/', (req, res) => {
    res.send('Estamos en los pedidos 2.');
});


router.post('/', async (req, res) => {
    const order = new Order({
        totalCost: req.body.totalCost,
        orderDate: req.body.orderDate,
        orderTime: req.body.orderTime,
        orderDatetime: req.body.orderDatetime,
        rating: req.body.rating,
        status: req.body.status,
        userEmail: req.body.userEmail,
        establishmentId: req.body.establishmentId
    });
    order.save()
        .then(dbOrder => {
            console.log(dbOrder);
            if (dbOrder._id) {
                let orderLines = [];
                for (let i = 0; i < 2; i++) {
                    const orderLine = new OrderLine({
                        amount: 3,
                        orderId: dbOrder._id,
                        dishId: '5e9b111d7535b66d002f19e9'
                    });
                    orderLines.push(orderLine);
                }
                const orderLineItems = new OrderLineList({
                    data: orderLines
                });

                orderLineItems.save()
                    .then(dbOrderLineList => {
                        res.json({ createdOrderLines: dbOrderLineList });
                        console.log('Order lines created');
                    }).catch(e => {
                        console.log('Error took place in order items ' + e);
                        res.json({
                            error: e
                        });
                    });
            }
        })
        .catch(error => {
            console.log('Error took place in order creation ' + error);
            res.json({ error: error });
        });
});

module.exports = router;