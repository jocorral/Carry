const mongoose = require('mongoose');
const creditCardInfo = mongoose.Schema({
    cardNumber : {type:String, required: true},
    expirationMonth : {type:String, required: true},
    expirationYear : {type:String, required: true},
    cvc : {type:String, required: true},
    name : {type:String, required: true},
    email : {type:String, required: true}
});

module.exports = mongoose.model('CreditCard', creditCardInfo);