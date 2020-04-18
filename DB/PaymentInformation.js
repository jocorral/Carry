const mongoose = require('mongoose');
const paymentInfo = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    cardNumber : String,
    expirationYear : Number,
    expirationMonth : Number,
    cvc : Number,
    userEmail : String
});

module.exports = PaymentInfo = mongoose.model('paymentInfo', paymentInfo);