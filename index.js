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
  var PROJECT_ID = 'carry-lajhni';
  var SESSION_ID = req.body.originalDetectIntentRequest.payload.conversation.conversationId;
  var speech;


  if (req.body.queryResult.intent.displayName == 'order') {
    if (req.body.queryResult && req.body.queryResult.parameters) {
      if (req.body.queryResult.parameters.plato && req.body.queryResult.parameters.numero) {
        speech = req.body.queryResult.parameters.numero !== 1 ?
          req.body.queryResult.parameters.numero + ' ' + req.body.queryResult.parameters.plato + 's, is this everything that you want to order?' :
          req.body.queryResult.parameters.numero + ' ' + req.body.queryResult.parameters.plato + ', is this everything that you want to order?';
      } else {
        speech = req.body.queryResult.parameters.plato ? req.body.queryResult.parameters.plato + ', is this everything that you want to order?' : "Something didn't go as planned, please repeat your request"
      }
    }
    /*req.body.queryResult.parameters.plato && req.body.queryResult.parameters.numero //&& req.body.queryResult.parameters.direccion
      ? req.body.queryResult.parameters.numero + ' ' + req.body.queryResult.parameters.plato + ', is this everything that you want to order?'
      : "Something didn't go as planned, please repeat your request";*/

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
      /*fulfillmenMessages: [{
        quickReplies: {
          title: "Is this everything?",
          quickReplies: [
            "Yes", "No"
          ]
        },
        platform: "GOOGLE ASSISTANT"
      },
      {
        text: {
          text: ["Dummy"]
        }
      }],*/
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }
  else if (req.body.queryResult.intent.displayName == 'confirmOrder') {
    var order = '';
    var totalCost = 0;
    if (req.body.queryResult && req.body.queryResult.parameters) {
      speech = req.body.queryResult.parameters.response == 'Yes' ? 'Alright! The total cost of your order is ' + totalCost + '€. Would you like to pay it now or pay it on your arrival?' : 'Sure, let\'s make the order again.';
      // Calculate payment
    }


    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: speech,
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }
  else if (req.body.queryResult.intent.displayName == 'paymentMethod') {
    var totalCost = 0;
    //This variable indicates whether the user wants to pay the order by credit card or manually
    var payByCredCard = null;
    if (req.body.queryResult && req.body.queryResult.parameters) {
      payByCredCard = req.body.queryResult.parameters.method == 'creditCard' ? true : false;
      // Calculate payment
    }

    if(payByCredCard != null)
    //If payment wants to be done by hand, save order in db, elsewise, launch next intent
    speech = !payByCredCard ? 'You selected the payment to be manual. Please wait for an email confirmation of the transaction.' : 'Please indicate the credit card number, its date of expiry and its CVV.'

    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: speech,
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }
  else if (req.body.queryResult.intent.displayName == 'pay') {
    var transactionCost = 0;
    var creditCardPAN = '';
    var validity = '';
    var cvv = '';
    var saveCreditCard = false;

    //If it wants to be saved, save it in mongo
    //Call external API and make payment
    //Call external API to send an email

    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: 'Nice! You have just paid your order, you will shortly receive an email with the information of your transaction.',
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }
  else {
    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: 'Something didn\'t go as planned, please restart the order.',
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

