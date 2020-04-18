const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Establishment = require('../DB/Establishment');

router.post('/', (req, res, next) => {
    var restaurante = new Establishment({
        // _id : new mongoose.Types.ObjectId(),
        name : req.body.name,
        phoneNumber : req.body.phoneNumber,
        location : req.body.location
    });

    // console.log(restaurante);

    restaurante.save()
        .then( data =>{
            console.log(data);
            res.status(201).json({
                message: 'Establishment was created',
                createdEstablishment : data
            })
        })
        .catch(error =>{
            console.log(error);
            res.status(500).json({
                message: 'Establishment with error',
                error : error
            });
        });

    /*try{
        const savedPedido = await pedido.save();
        res.json(savedPedido);
       
    }
    catch(err) {
        console.error(err);
        res.json({ message:err });
    }*/
});

router.get('/:establishId', (req, res, next) => {
    const id = req.params.establishId;
    Establishment.findById(id)
        .exec()
        .then(doc => {
            doc.forEach(restaurant => {
                console.log(restaurant.name);
            });
            res.status(200).json(doc);
        })
        .catch(err => {
            console.error('ERROR' ,err);
            res.status(500).json({ error: err });
        });
});

router.get('/', (req, res, next) => {
    Establishment.find()
        .exec()
        .then(docs => {
            docs.forEach(restaurant => {
                console.log(restaurant.name);
            });
            res.status(200).json(docs);
        })
        .catch(err => {
            console.error('ERROR' ,err);
            res.status(500).json({ error: err });
        });
});


module.exports = router;