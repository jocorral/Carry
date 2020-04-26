const express = require('express');
const router = express.Router();
const Order = require('../DB/Order');
const OrderLine = require('../DB/OrderLine');
const OrderLineList = require('../DB/OrderLineList');


router.get('/:status', (req, res) => {
    const status = req.params.status;
    Order.find({status: status,userEmail:'jorgecrrl@gmail.com'}).exec()
    .then(docs => {
        docs.forEach(order => {
            console.log(order.orderTime);
        });
        res.status(200).json({status:status,recordNumber:docs.length,data:docs});
    })
    .catch(err => {
        console.error('ERROR' ,err);
        res.status(500).json({ error: 'No establishment found with id ' + eId + ' ' + err });
    });
});


router.post('/', async (req, res) => {
    const order = new Order({
        totalCost: req.body.totalCost,
        orderDate: req.body.orderDate,
        orderTime: req.body.orderTime,
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
                        amount: 3 + i,
                        orderId: dbOrder._id,
                        dishId: '5ea4769c3132ad5fa0291f78'
                    });
                    orderLines.push(orderLine);
                }
                const orderLineItems = new OrderLineList({
                    data: orderLines
                });

                orderLineItems.save()
                    .then(dbOrderLineList => {
                        res.json({ orderInfor: dbOrder, createdOrderLines: dbOrderLineList });
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