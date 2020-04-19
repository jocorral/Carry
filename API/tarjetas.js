const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CryptoJS = require("crypto-js");
const CreditCard = require('../DB/CreditCard');

const KEY = "Carry";


router.post('/', async (req, res, next) => {

    var cvc = req.body.cvc;
    var cvc_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(cvc), KEY).toString();
    var creditCardNum_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(req.body.cardNumber), cvc).toString();
    var expirationMonth_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(req.body.expirationMonth), cvc).toString();
    var expirationYear_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(req.body.expirationYear.substring(req.body.expirationYear.length - 2)), cvc).toString();

    var insertedC = await CreditCard.findOneAndUpdate(
        { email: req.body.email },
        {
            $set: {
                cardNumber: creditCardNum_Encrypted,
                expirationMonth: expirationMonth_Encrypted,
                expirationYear: expirationYear_Encrypted,
                cvc: cvc_Encrypted,
                name: req.body.name,
                email: req.body.email
            }
        },
        { upsert: true }
    );
    
    if(insertedC != null){
        var cvc_de = JSON.parse(CryptoJS.AES.decrypt(cvc_Encrypted, KEY).toString(CryptoJS.enc.Utf8));
        console.log(cvc_de);
        var cardnumber_de = JSON.parse(CryptoJS.AES.decrypt(creditCardNum_Encrypted, cvc_de).toString(CryptoJS.enc.Utf8));
        var year_de = JSON.parse(CryptoJS.AES.decrypt(expirationYear_Encrypted, cvc_de).toString(CryptoJS.enc.Utf8));
        var month_de = JSON.parse(CryptoJS.AES.decrypt(expirationMonth_Encrypted, cvc_de).toString(CryptoJS.enc.Utf8));
    
        res.status(201).json({message:'Credit card was updated', data:insertedC, decrypted:{
            cvc:cvc_de,
            cardNumber: cardnumber_de,
            year: year_de,
            month: month_de
        }});
    }else{
        var cvc_de = JSON.parse(CryptoJS.AES.decrypt(cvc_Encrypted, KEY).toString(CryptoJS.enc.Utf8));
        var cardnumber_de = JSON.parse(CryptoJS.AES.decrypt(creditCardNum_Encrypted, cvc_de).toString(CryptoJS.enc.Utf8));
        var year_de = JSON.parse(CryptoJS.AES.decrypt(expirationYear_Encrypted, cvc_de).toString(CryptoJS.enc.Utf8));
        var month_de = JSON.parse(CryptoJS.AES.decrypt(expirationMonth_Encrypted, cvc_de).toString(CryptoJS.enc.Utf8));
        res.status(201).json({message:'Credit card was created', data:{
                cardNumber: creditCardNum_Encrypted,
                expirationMonth: expirationMonth_Encrypted,
                expirationYear: expirationYear_Encrypted,
                cvc: cvc_Encrypted,
                name: req.body.name,
                email: req.body.email
            },
            decrypted : {
                cvc:cvc_de,
                cardNumber: cardnumber_de,
                year: year_de,
                month: month_de
            }
        });
    }
    
});

router.get('/', (req, res, next) => {
    CreditCard.find()
        .exec()
        .then(docs => {
            docs.forEach(card => {
                console.log(card.email);
            });
            res.status(200).json(docs);
        })
        .catch(err => {
            console.error('ERROR', err);
            res.status(500).json({ error: err });
        });
});

/*router.get('/:establishId', (req, res, next) => {
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
});*/

module.exports = router;