const mongoose = require('mongoose');
const user = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    name : String,
    email : String
});

module.exports = User = mongoose.model('user', user);