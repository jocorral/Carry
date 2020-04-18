const express = require('express');
const router = express.Router();
const Order = require('../DB/Order');


router.get('/', (req, res) => {
    res.send('Estamos en los pedidos 2.');
});


router.post('/', async(req, res) => {
    const order = new Order({        
        totalCost : req.body.totalCost,
        orderDate : req.body.orderDate,
        orderTime : req.body.orderTime,
        orderDatetime : req.body.orderDatetime,
        rating : req.body.rating,
        status : req.body.status,
        userEmail : req.body.userEmail,
        establishmentId : req.body.establishmentId
    });
    order.save()
    .then(dbOrder =>{
        console.log(dbOrder);
        if(dbOrder._id){
            for(let i = 0; i<2; i++){
              const orderLine = new OrderLine({
                amount : 3,
                orderId : dbOrder._id,
                dishId : '5e9b111d7535b66d002f19e9'
              });

              orderLine.save()
              .then(dbOrderLine => {
                res.json(dbOrderLine);
                console.log('Order lines created');
              }).catch(e =>{
                console.log('Error took place' + e);
                res.json({"errorOrderLine":e});
              });
            }
          }
    })
    .catch(error =>{
        console.log('Error took place' + error);
        res.json({"errorOrder":error});
    });
});

module.exports = router;