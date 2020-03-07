const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

//URI format mongodb+srv://<username>:<password>@namecluster....
//URI DE PRUEBA
const URI = "mongodb+srv://dbUser:dbUser@carrycluster-wh3rm.gcp.mongodb.net/test?retryWrites=true&w=majority";
//URI OK const URI = "mongodb+srv://dbUser:dbUser@carrycluster-wh3rm.gcp.mongodb.net/CarryDB?retryWrites=true&w=majority";
//To connect to db, create an asynchronous method that calls the mongoose extension and connects with the specified uri
mongoose.connect(URI, { useUnifiedTopology: true, useNewUrlParser: true }, () =>
    console.log('Carry cluster in Mongodb has been reached')
);


app.use(express.json({extended:false}));
app.use('/pedidos', require('./API/pedidos'));

//Check if any port is free, else use 3000
const Port =  3000; //process.env.Port ||

app.listen(Port, () => console.log('Server started...'));