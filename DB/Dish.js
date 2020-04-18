const mongoose = require('mongoose');
const dish = mongoose.Schema({
    //_id : mongoose.Schema.Types.ObjectId,
    name : String,
    price : Number,
    weight : Number,
    kcal : Number,
    idWords : Array,
    establishmentId : {type: mongoose.Schema.Types.ObjectId, ref:'Establishment', required: true}
});

module.exports = mongoose.model('Dish', dish);