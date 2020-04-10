"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');

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
  var speech = '';

  var idToken = req.body.originalDetectIntentRequest.payload.user.idToken;
  let userInformationJSON = jwt.decode(idToken);

  /* DEFAULT WELCOME - START */
  if (req.body.queryResult.intent.displayName == 'defaultWelcome') {
    return res.json({
      fulfillmentText: 'Hello ' + userInformationJSON.given_name + '! I\'m Carry, what can I help you in today?'
    });
  }
  /* DEFAULT WELCOME - END */

  /* ACTION SELECTION - START */
  else if (req.body.queryResult.intent.displayName == 'actionSelection') {
    //To switch between actions, confirm that the query brings parameters
    if (req.body.queryResult && req.body.queryResult.parameters) {
      //Confirm that variable selectedAction exists
      if (req.body.queryResult.parameters.selectedAction) {
        //If contains "to evaluate" the context will be of evaluation
        if (req.body.queryResult.parameters.selectedAction.includes('to evaluate')) {
          //If an order wants to be evaluated, the context is set to evaluation
          // TODO Get list of delivered orders for that user information
          var listOfDeliveredOrders = [];
          listOfDeliveredOrders[0] = { "name": "July 23, 2019" };
          listOfDeliveredOrders[1] = { "name": "July 24, 2019" };
          listOfDeliveredOrders[2] = { "name": "July 25, 2019" };
          listOfDeliveredOrders[3] = { "name": "July 26, 2019" };
          listOfDeliveredOrders[4] = { "name": "July 27, 2019" };

          var listString = '';

          // List of delivered orders will be stringified so that the assistant prints them
          if (listOfDeliveredOrders.length !== 0) {
            for (let i = 0; i < listOfDeliveredOrders.length; i++) {
              listString = listString + (i + 1) + ' - ' + listOfDeliveredOrders[i].name + '\n';
            }
          }


          // Return response to user
          return res.json({
            fulfillmentText: 'The list of delivered orders is the following: ' + listString + ' which one of them do you want to evaluate?',
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_evaluation",
                lifespanCount: 5,
                parameters: {
                  "deliveredorders": listOfDeliveredOrders
                }
              }
            ]
          });
        }

        //If contains "to cancel" the context will be of cancelation
        else if (req.body.queryResult.parameters.selectedAction.includes('to cancel')) {
          //If an order wants to be cancelled, the context is set to cancelation
          //Get list of active orders
          var listOfActiveOrders = [];
          var listString = '';

          listOfActiveOrders[0] = { "name": "June 23, 2019" };
          listOfActiveOrders[1] = { "name": "June 24, 2019" };
          listOfActiveOrders[2] = { "name": "June 25, 2019" };
          listOfActiveOrders[3] = { "name": "June 26, 2019" };
          listOfActiveOrders[4] = { "name": "June 27, 2019" };
          if (listOfActiveOrders.length !== 0) {
            for (let i = 0; i < listOfActiveOrders.length; i++) {
              listString = listString + (i + 1) + ' - ' + listOfActiveOrders[i].name + '\n';
            }
          }
          return res.json({
            fulfillmentText: 'The list of active order is the following: ' + listString + ' which one of them do you want to cancel?',
            speech: speech,
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_cancelation",
                lifespanCount: 3,
                parameters: {
                  "activeorders": listOfActiveOrders
                }
              }
            ]
          });
        }

        //If contains "to make"/"to place"/"to order" the context will be creation
        else if (
          req.body.queryResult.parameters.selectedAction.includes('to make') ||
          req.body.queryResult.parameters.selectedAction.includes('to place') ||
          req.body.queryResult.parameters.selectedAction.includes('to order')
        ) {
          //If an order wants to be cancelled, the context is set to cancelation
          return res.json({
            fulfillmentText: 'Where do you want to make the order and for what time do you want it?',
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_order",
                lifespanCount: 21
              }
            ]
          });
        }

        //If contains "to test" is because it's being used for testing purposes
        else if (req.body.queryResult.parameters.selectedAction.includes('to test')) {

          // Return response to user
          return res.json({
            fulfillmentText: 'Ok ' + userInformationJSON.given_name + ' with email ' + userInformationJSON.email
          });
        }

        //Prompt help text if the user makes an action that was not correct
        else {
          //In any other case, a help message will be prompted
          return res.json({
            fulfillmentText: 'I\'m sorry, I wasn\'t able to understand what you said, try with something like \"I want to make an order.\", \"I\'d like to evaluate an order.\", or \"I would like to cancel an active order.\".',
            speech: speech,
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_selection_error",
                lifespanCount: 1
              }
            ]
          });
        }
      }
    }
  }
  /* ACTION SELECTION - END */

  /* CANCELLATION RELATED ACTIONS - START */
  else if (req.body.queryResult.intent.displayName == 'cancelOrder') {
    var contextMatched = false;
    var activeOrdersList;
    //Recover the list of active orders from context
    req.body.queryResult.outputContexts.forEach(context => {
      //Find the correct context
      if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_cancelation") {
        contextMatched = true;
        //Find if the variable exists
        if (context.parameters.activeorders) {
          //Assign variable to the active order list
          activeOrdersList = context.parameters.activeorders;
        }
      }
    });

    if (!contextMatched) {
      return res.json({
        fulfillmentText: 'Some error with the context names took place, please try again.'
      });
    }

    //Check if it contains parameters
    if (req.body.queryResult && req.body.queryResult.parameters) {
      //Number parameter must exist
      if (req.body.queryResult.parameters.number) {
        let number = parseInt(req.body.queryResult.parameters.number);
        //If the inserted number is bigger than the deliver order list length, don't allow it
        if (number > activeOrdersList.length || number < 1) {
          //Return error response to the user
          return res.json({
            fulfillmentText: 'The specified number is not correct because it\'s not between 1 and ' + activeOrdersList.length + '. Which one do you want to cancel?',
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_cancelation",
                lifespanCount: 3
              }
            ]
          });
        } else {
          //Return the response to user, adding the parameter to context
          return res.json({
            fulfillmentText: 'Are you sure you want to cancel order number ' + number + '?',
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/cancelorder-followup",
                lifespanCount: 2,
                parameters: {
                  "number": number
                }
              }
            ]
          });
        }
      }
    }
  }
  else if (req.body.queryResult.intent.displayName == 'confirmCancelation') {
    //Variable to control if any of the context matches the specified context name
    let contextMatched = false;
    //Check if there are any context
    if (req.body.queryResult.outputContexts) {
      req.body.queryResult.outputContexts.forEach(context => {
        //Check if any of the context names matches the one that is being looked for
        if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/cancelorder-followup") {
          //If context matches, set control variable to true
          contextMatched = true;
          //Then check that the variable number exists in that context
          if (context.parameters.number) {
            //Variable in number is not adapted to array, adapt it
            let number = context.parameters.number;
            let arrayPosition = number - 1;

            //TODO Make modifications on DB

            //Return response to user
            return res.json({
              fulfillmentText: 'Order number ' + number + ' has been cancelled. (Array pos: ' + arrayPosition + ')',
            });
          } else {
            return res.json({
              fulfillmentText: 'Context did not contain the necesary parameter ' + JSON.stringify(context),
            });
          }
        }
      });
    }

    //Check if context was not found
    if (!contextMatched) {
      return res.json({
        fulfillmentText: 'The name of the context was not found between the current context list ' + JSON.stringify(req.body.queryResult.outputContexts),
      });
    }

  }
  /* CANCELLATION RELATED ACTIONS - END */


  /* EVALUATION RELATED ACTIONS - START */
  else if (req.body.queryResult.intent.displayName == 'evaluateOrder') {
    var contextMatched = false;
    var deliveredOrderList;
    //Recover the list of delivered orders from context
    req.body.queryResult.outputContexts.forEach(context => {
      //Find the correct context
      if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_evaluation") {
        contextMatched = true;
        //Find if the variable exists
        if (context.parameters.deliveredorders) {
          //Assign variable to the delivered order list
          deliveredOrderList = context.parameters.deliveredorders;
        }
      }
    });
    //If context wasn't found, send a message to user
    if (!contextMatched) {
      return res.json({
        fulfillmentText: 'Some error with the context names took place, please try again.'
      });
    }

    //Check if it contains parameters
    if (req.body.queryResult && req.body.queryResult.parameters) {
      //Number parameter must exist
      if (req.body.queryResult.parameters.number) {
        let number = parseInt(req.body.queryResult.parameters.number);
        //If the inserted number is bigger than the deliver order list length, don't allow it
        if (number > deliveredOrderList.length || number < 1) {
          //Return error response to the user
          return res.json({
            fulfillmentText: 'The specified number is not correct, it needs to be between 1 and ' + deliveredOrderList.length + '.'
          });
        } else {
          //Return the response to user, adding the parameter to context
          return res.json({
            fulfillmentText: 'What is the value you want to set? Indicate a number between 1 and 10, please. Take into consideration that decimal values will be discarded.',
            outputContexts: [
              {
                name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/evaluateorder-followup",
                lifespanCount: 2,
                parameters: {
                  "number": number
                }
              }
            ]
          });
        }
      }
    }
  }
  else if (req.body.queryResult.intent.displayName == 'setEvaluationValue') {
    let insertedValue = 0;
    let selectedPosition;

    //If the position was seelected previously, recover it.
    req.body.queryResult.outputContexts.forEach(context => {
      if (context.name == "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/evaluateorder-followup") {
        if (context.parameters && context.parameters.number) {
          selectedPosition = context.parameters.number;
        }
      }
    });

    //Check if inserted value is not between 1 and 10
    if (req.body.queryResult.parameters.value) {
      insertedValue = parseInt(req.body.queryResult.parameters.value);
      if (insertedValue < 1 || insertedValue > 10) {
        return res.json({
          fulfillmentText: 'Please insert a value between 1 and 10, ' + insertedValue + ' is not between those limits.',
          outputContexts: [{
            name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/evaluateorder-followup",
            lifespanCount: 2,
            parameters: {
              "number": selectedPosition
            }
          }]
        });
      }
      else {
        return res.json({
          fulfillmentText: 'You want to set a value of ' + insertedValue + ' in the position number ' + selectedPosition + ', is that right?',
          outputContexts: [{
            name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/setEvaluationValue-followup",
            lifespanCount: 2,
            parameters: {
              "evaluationposition": selectedPosition,
              "evaluationvalue": insertedValue
            }
          }]
        });
      }
    }
  }
  else if (req.body.queryResult.intent.displayName == 'confirmEvaluation') {
    var contextMatched = false;
    var selectedposition;
    var insertedValue;
    var arrayPosition;
    //Recover the list of delivered orders from context
    req.body.queryResult.outputContexts.forEach(context => {
      //Find the correct context
      if (context.name == "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/setevaluationvalue-followup") {
        contextMatched = true;
        //Find if the variable exists
        if (context.parameters.evaluationposition) {
          //Assign variable to the delivered order list
          selectedposition = context.parameters.evaluationposition;
          arrayPosition = selectedposition - 1;
        }
        if (context.parameters.evaluationvalue) {
          //Assign variable to the delivered order list
          insertedValue = context.parameters.evaluationvalue;
        }
      }
    });

    //If context wasn't found, send a message to user
    if (!contextMatched) {
      return res.json({
        fulfillmentText: 'Some error with the context names took place, please try again.'
      });
    }
    //If everything is okay, save the value in database and indicate process finish to user.
    else {
      //TODO manage values in DB

      return res.json({
        fulfillmentText: 'The position ' + selectedposition + ' has been evaluated with a ' + insertedValue + '. (Array position ' + arrayPosition + ')'
      });
    }
  }
  /* EVALUATION RELATED ACTIONS - END */

  /* ORDER RELATED ACTIONS - START */
  else if (req.body.queryResult.intent.displayName == 'placeOrder') {
    let datetime;
    let restaurant;
    //Select a restaurant and a time for the order to be received
    if (req.body.queryResult.parameters && req.body.queryResult.parameters.restaurant) {
      restaurant = req.body.queryResult.parameters.restaurant;
    }
    if (req.body.queryResult.parameters && req.body.queryResult.parameters.time) {
      datetime = req.body.queryResult.parameters.time;
    }

    var listOfAvailableItemsString = '';

    //Query the items that the shop offers to return to the user
    var listOfAvailableItems = [];
    listOfAvailableItems[0] = { "name": "Chocolate cookie", "price": 3, "idwords": ["chocolate", "cookie"] };
    listOfAvailableItems[1] = { "name": "Pizza Margarita (large)", "price": 19.5, "idwords": ["large", "margarita"] };
    listOfAvailableItems[2] = { "name": "4 cheese pizza (medium)", "price": 12, "idwords": ["cheese", "4", "medium"] };
    listOfAvailableItems[3] = { "name": "Coca cola (medium)", "price": 2.5, "idwords": ["cola", "medium", "coca"] };
    listOfAvailableItems[4] = { "name": "Meatball pizza (medium)", "price": 15, "idwords": ["pizza", "meatball", "medium"] };
    if (listOfAvailableItems.length !== 0) {
      for (let i = 0; i < listOfAvailableItems.length; i++) {
        listOfAvailableItemsString = listOfAvailableItemsString + (i + 1) + ' - ' + listOfAvailableItems[i].name + '\n';
      }
    }

    //Adapt time variable to show only the necesary information
    var regExTime = /(?<=T)(.*?)(?=\+)/g;
    var regExDate = /(.*?)(?=T)/g;
    let time = regExTime.exec(datetime)[0];
    let timeWithoutSeconds = time.substring(0, time.length - 3);
    let date = regExDate.exec(datetime)[0];

    // Return response to user
    return res.json({
      fulfillmentText: 'Great! Order will be placed at ' + restaurant + ' for ' + date + ' at ' + time + '.\n' + // 
        'This restaurant contains the following available items ' + listOfAvailableItemsString + '.',
      outputContexts: [
        {
          name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_order_placed",
          lifespanCount: 5,
          parameters: {
            "restaurant": restaurant,
            "date": date,
            "time": timeWithoutSeconds,
            "availableItems": listOfAvailableItems
          }
        }
      ]
    });
  }
  else if (req.body.queryResult.intent.displayName == 'orderItems') {
    var contextMatched = false;
    var itemList;
    //Recover the list of active orders from context
    req.body.queryResult.outputContexts.forEach(context => {
      //Find the correct context
      if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_order_placed") {
        contextMatched = true;
        //Find if the variable exists
        if (context.parameters.availableItems) {
          //Assign variable to the active order list
          itemList = context.parameters.availableItems;
        }
      }
    });

    if (req.body.queryResult.parameters && req.body.queryResult.parameters.dish) {
      //Create a list of the said words
      let wordList = req.body.queryResult.parameters.dish[0].split(" ");

      //Clean list of plurals
      const endings = {
        ves: 'fe',
        ies: 'y',
        i: 'us',
        zes: '',
        ses: '',
        es: '',
        s: ''
      };
      
      for(let i = 0; i<wordList.length; i++){
          //Irregular cases
          if(wordList[i].toLowerCase() === 'cookies'){
            wordList[i] = 'cookie';
          }
          else if(wordList[i].toLowerCase() === 'smoothies'){
            wordList[i] = 'smoothie';
          }
          else{
            wordList[i] = wordList[i].replace(
            new RegExp(`(${Object.keys(endings).join('|')})$`),
            r => endings[r]);   
          }
      }

      //Check if the selected items are between the available options
      //For that, iterate all the items in itemList
      let selectedItem = null;
      itemList.forEach(item => {
        //If a wordlist includes all the idwords of this specific item, return the item, if not, return null
        if (item.idwords.every(word => wordList.includes(word))) {
          selectedItem = item;
        }
      });

      let itemString = JSON.stringify(selectedItem);

      if (selectedItem === null) {
        //Launch error
        return res.json({
          fulfillmentText: 'An error took place trying to select an specific item by the words ' + wordList
        });
      } else {

        // TODO Recover the list of previously selected items and push this item to the list

        let specifiedAmount = 1;
        if (req.body.queryResult.parameters.amount) {
          specifiedAmount = req.body.queryResult.parameters.amount;
        }

        return res.json({
          fulfillmentText: 'You\'ve selected ' + specifiedAmount + ' item of ' + selectedItem.name + ', is this everything that you want to order?'
          // outputContexts : [
          //   {
          //     name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_order_confirmation",
          //     lifespanCount: 5,
          //     parameters: {
          //       "selectedItems" : selectedItems
          //     }
          //   }
          // ]
        });
      }
    }
  }
  else if (req.body.queryResult.intent.displayName == 'confirmOrder') {
    var order = '';
    var totalCost = 0;
    if (req.body.queryResult && req.body.queryResult.parameters) {
      speech = req.body.queryResult.parameters.response == 'Yes' ? 'Alright! The total cost of your order is ' + totalCost + '€. Would you like to pay it now or pay it on your arrival?' : 'Sure, let\'s make the order again.';
      // Calculate payment
    }


    return res.json({
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

    if (payByCredCard != null)
      //If payment wants to be done by hand, save order in db, elsewise, launch next intent
      speech = !payByCredCard ? 'You selected the payment to be manual. Please wait for an email confirmation of the transaction.' : 'Please indicate the credit card number, its date of expiry and its CVV.'

    return res.json({
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
    var cvc = '';
    var saveCreditCard = false;

    //If it wants to be saved, save it in mongo
    //Call external API and make payment
    //Call external API to send an email

    return res.json({
      //data: speechResponse,
      fulfillmentText: 'Nice! You have just paid your order, you will shortly receive an email with the information of your transaction.',
      speech: speech,
      displayText: speech,
      source: "webhook-echo-sample"
    });
  }
  /* ORDER RELATED ACTIONS - START */


  /* NO RELATED ACTIONS */
  else {
    return res.json({
      payload: speechResponse,
      //data: speechResponse,
      fulfillmentText: 'Something didn\'t go as planned, please restart the order. Current selected intent was ' + req.body.queryResult.intent.displayName,
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

