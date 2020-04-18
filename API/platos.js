const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Dish = require('../DB/Dish');
const Establishment = require('../DB/Establishment');


router.post('/', (req, res, next) => {
    var plato = new Dish({
        // _id : new mongoose.Types.ObjectId(),
        name : req.body.name,
        price : req.body.price,
        weight : req.body.weight,
        kcal : req.body.kcal,
        idWords : req.body.idWords,
        establishmentId : req.body.establishmentId
    });

    // console.log(plato);

    plato.save()
        .then( data =>{
            console.log(data)
            res.status(201).json({
                message: 'Dish was created',
                createdDish : data
            })
        })
        .catch(error =>{
            console.log(error);
            res.status(500).json({
                message: 'Dish with error',
                error : error
            });
        });
});

router.get('/:establishmentName', (req, res, next) => {
    const eName = req.params.establishmentName;
    var eId;

    Establishment.find().where('name').equals(eName).exec()
    .then(docs =>{
        docs.forEach(restaurant => {
            console.log(restaurant.name);
        });
        eId = docs[0]._id;
        console.log(eId);
        if(eId){
            Dish.find().where('establishmentId').equals(eId)
            .exec()
            .then(docs => {
                docs.forEach(dish => {
                    console.log(dish.name);
                });
                res.status(200).json(docs);
            })
            .catch(err => {
                console.error('ERROR' ,err);
                res.status(500).json({ error: 'No establishment found with id ' + eId + ' ' + err });
            });
        }   
    })
    .catch(err => {
        console.error('ERROR' ,err);
        res.status(500).json({ error: 'No establishment found with that name ' + err });
    }); 
});



module.exports = router;