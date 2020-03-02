"use strict";

const express = require("express");
const bodyParser = require("body-parser");

const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

restService.use(bodyParser.json());

restService.post("/webhook", function (req, res) {

  if (req.body.queryResult.intent.name == 'order') {
    var speech;
    if (req.body.queryResult && req.body.queryResult.parameters) {
      if (req.body.queryResult.parameters.plato && req.body.queryResult.parameters.numero) {
        speech = req.body.queryResult.parameters.plato !== 1 ?
          req.body.queryResult.parameters.numero + ' ' + req.body.queryResult.parameters.plato + 's, coming up!' :
          req.body.queryResult.parameters.numero + ' ' + req.body.queryResult.parameters.plato + ', coming up!';
      } else {
        speech = req.body.queryResult.parameters.plato ? req.body.queryResult.parameters.plato + ', coming up!' : "Something didn't go as planned, please repeat your request"
      }
    }
    req.body.queryResult.parameters.plato && req.body.queryResult.parameters.numero //&& req.body.queryResult.parameters.direccion
      ? req.body.queryResult.parameters.numero + ' ' + req.body.queryResult.parameters.plato + ', coming up!'
      : "Something didn't go as planned, please repeat your request";

    var speechResponse = {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: speech
              }
            }
          ]
        }
      }
    };

    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: speech,
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }
  else if(req.body.queryResult.intent.name == 'pay'){
    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: 'Nice! You have just paid your ' + req.body.queryResult.parameters.coste + '€' ,
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }else{
    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: 'Something didn\'t go as planned, the intent name is: ' + req.body.queryResult.intent.name,
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }


});


restService.listen(process.env.PORT || 8000, function () {
  console.log("Server up and listening");
});

/*Parte potencial del package.json
{
  "name": "carrywebhook",
  "version": "1.0.0",
  "description": "Webhook para el PFM",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jocorral/Carry.git"
  },
  "keywords": [
    "assistant",
    "voice",
    "dialogflow"
  ],
  "author": "jocorral",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/jocorral/Carry/issues"
  },
  "homepage": "https://github.com/jocorral/Carry#readme",
  "dependencies": {
    "body-parser": "^1.19.0",
    "express": "^4.17.1",
    "mongoose": "^5.8.11",
    "moongoose": "0.0.5"
  }
}*/

/*restService.post("/pedido", (request, response) => {
    var response = request.body.queryResult &&
        request.body.queryResult.parameters &&
        request.body.queryResult.parameters.echoText
        ? request.body.queryResult.parameters.echoText
        : "Seems like some problem. Speak again.";

    var speechResponse = {
        google: {
            expectUserResponse: true,
            richResponse = {
                items: [{
                    simpleResponse: {
                        textToSpeech: response
                    }
                }]
            }
        }
    };

    return response.json({
        payload: speechResponse,
        //data: ,
        fulfillmentText: "Respuesta por defecto",
        speech: speechResponse,
        displayText: speechResponse,
        source: "carry-ws"
    });
});*/

