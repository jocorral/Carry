"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const converter = require('number-to-words');
const mongoose = require('mongoose');
var CryptoJS = require("crypto-js");

const Dish = require('./DB/Dish');
const Order = require('./DB/Order');
const OrderLine = require('./DB/OrderLine');
const OrderLineList = require('./DB/OrderLineList');
const Establishment = require('./DB/Establishment');
const CreditCard = require('./DB/CreditCard');

const URI = "mongodb+srv://dbUser:dbUser@carrycluster-wh3rm.gcp.mongodb.net/test?retryWrites=true&w=majority";
const KEY = "Carry";

const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

mongoose.connect(URI, {
  //useMongoClient: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false
}, () =>
  console.log('Carry cluster in Mongodb has been reached')
);

restService.use(bodyParser.json());
//restService.use(express.json({extended:false}));


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
          var listOfDeliveredOrders = [];

          Order.find({ status: 'Delivered', userEmail: userInformationJSON.email, rating: 0 }).exec()
            .then(orderList => {
              orderList.forEach(order => {
                listOfDeliveredOrders.push({
                  "name": 'Order on ' + order.orderDate + ' at ' + order.orderTime + ' with a ' + order.totalCost + '€ cost',
                  "id": order._id
                });
              });

              var listString = '';

              // List of delivered orders will be stringified so that the assistant prints them
              if (listOfDeliveredOrders.length !== 0) {
                for (let i = 0; i < listOfDeliveredOrders.length; i++) {
                  listString = listString + '\n' + (i + 1) + ' - ' + listOfDeliveredOrders[i].name;
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
            })
            .catch(err => {
              return res.json({
                fulfillmentText: 'An error took place trying to recover the information related to the delivered orders ' + JSON.stringify(err)
              });
            });
        }

        //If contains "to cancel" the context will be of cancelation
        else if (req.body.queryResult.parameters.selectedAction.includes('to cancel')) {
          //If an order wants to be cancelled, the context is set to cancelation
          //Get list of active orders
          var listOfActiveOrders = [];
          var listString = '';

          Order.find({ status: 'Active', userEmail: userInformationJSON.email }).exec()
            .then(orderList => {
              orderList.forEach(order => {
                listOfActiveOrders.push({
                  "name": 'Order on ' + order.orderDate + ' at ' + order.orderTime + ' with a ' + order.totalCost + '€ cost',
                  "id": order._id
                });
              });

              if (listOfActiveOrders.length !== 0) {
                for (let i = 0; i < listOfActiveOrders.length; i++) {
                  listString = listString + '\n' + (i + 1) + ' - ' + listOfActiveOrders[i].name;
                }
              }

              return res.json({
                fulfillmentText: 'The list of active order is the following: ' + listString + ' which one of them do you want to cancel?',
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
            })
            .catch(activeOrderError => {
              return res.json({
                fulfillmentText: 'Error trying to retrieve the active orders ' + JSON.stringify(activeOrderError)
              });
            });
        }

        //If contains "to make"/"to place"/"to order" the context will be creation
        else if (
          req.body.queryResult.parameters.selectedAction.includes('to make') ||
          req.body.queryResult.parameters.selectedAction.includes('to place') ||
          req.body.queryResult.parameters.selectedAction.includes('to order') ||
          req.body.queryResult.parameters.selectedAction.includes('to create')
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
            fulfillmentText: 'All the user information is ' + JSON.stringify(userInformationJSON)
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
    var activeOrderList;
    //Recover the list of active orders from context
    req.body.queryResult.outputContexts.forEach(context => {
      //Find the correct context
      if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_cancelation") {
        contextMatched = true;
        //Find if the variable exists
        if (context.parameters.activeorders) {
          //Assign variable to the active order list
          activeOrderList = context.parameters.activeorders;
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
        if (number > activeOrderList.length || number < 1) {
          //Return error response to the user
          return res.json({
            fulfillmentText: 'The specified number is not correct because it\'s not between 1 and ' + activeOrderList.length + '. Which one do you want to cancel?',
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
                  "number": number,
                  "activeOrders": activeOrderList
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
    let activeOrderList;
    //Check if there are any context
    if (req.body.queryResult.outputContexts) {
      req.body.queryResult.outputContexts.forEach(context => {
        //Check if any of the context names matches the one that is being looked for
        if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/cancelorder-followup") {
          //If context matches, set control variable to true
          contextMatched = true;
          //Find if the variable exists
          if (context.parameters.activeorders) {
            //Assign variable to the active order list
            activeOrderList = context.parameters.activeorders;
          }
          //Then check that the variable number exists in that context
          if (context.parameters.number) {
            //Variable in number is not adapted to array, adapt it
            let number = context.parameters.number;
            let arrayPosition = number - 1;

            Order.findByIdAndUpdate(activeOrderList[arrayPosition].id, { $set: { status: 'Canceled' } },
              function (errorOrderEvaluation, orderUpdated) {
                if (orderUpdated) {
                  return res.json({
                    fulfillmentText: 'The order ' + activeOrderList[arrayPosition].name + ' has been canceled.'
                  });
                } else {
                  return res.json({
                    fulfillmentText: 'An error took place inserting the rating to database. ' + JSON.stringify(errorOrderEvaluation) +
                      'Position ' + JSON.stringify(arrayPosition) + '. Id ' + JSON.stringify(activeOrderList[arrayPosition].id)
                  });
                }
              });
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
                  "number": number,
                  "deliveredOrders": deliveredOrderList
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
    let deliveredOrderList;

    //If the position was seelected previously, recover it.
    req.body.queryResult.outputContexts.forEach(context => {
      if (context.name == "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/evaluateorder-followup") {
        if (context.parameters && context.parameters.number) {
          selectedPosition = context.parameters.number;
        }
        if (context.parameters && context.parameters.deliveredOrders) {
          deliveredOrderList = context.parameters.deliveredOrders;
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
              "number": selectedPosition,
              "deliveredOrders": deliveredOrderList
            }
          }]
        });
      }
      else {
        return res.json({
          fulfillmentText: 'You want to set a value of ' + insertedValue + ' in the order in the order number ' + selectedPosition + ', is that right?',
          outputContexts: [{
            name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/setEvaluationValue-followup",
            lifespanCount: 2,
            parameters: {
              "evaluationposition": selectedPosition,
              "evaluationvalue": insertedValue,
              "deliveredOrders": deliveredOrderList
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
    var deliveredOrderList;
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
          insertedValue = parseInt(context.parameters.evaluationvalue);
        }
        if (context.parameters.deliveredOrders) {
          //Assign variable to the delivered order list
          deliveredOrderList = context.parameters.deliveredOrders;
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
      Order.findByIdAndUpdate(deliveredOrderList[arrayPosition].id, { $set: { rating: insertedValue } },
        function (errorOrderEvaluation, orderUpdated) {
          if (orderUpdated) {
            return res.json({
              fulfillmentText: 'The order ' + deliveredOrderList[arrayPosition].name + ' has been evaluated with a ' + JSON.stringify(insertedValue) + '. Id ' + JSON.stringify(deliveredOrderList[arrayPosition].id) +
                ' received ' + JSON.stringify(orderUpdated)
            });
          } else {
            return res.json({
              fulfillmentText: 'An error took place inserting the rating to database. ' + JSON.stringify(errorOrderEvaluation) +
                'Value ' + JSON.stringify(insertedValue) + '. Id ' + JSON.stringify(deliveredOrderList[arrayPosition].id) +
                ' received ' + JSON.stringify(orderUpdated)
            });
          }
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

    var listOfAvailableItemsStringWritten = '';

    //Query the items that the shop offers to return to the user
    var listOfAvailableItems = [];

    var eId;
    Establishment.find().where('name').equals(restaurant).exec()
      .then(docs => {
        if (docs.length != 0) {
          eId = docs[0]._id;

          if (eId) {
            Dish.find().where('establishmentId').equals(eId)
              .exec()
              .then(docs => {
                docs.forEach(dish => {
                  listOfAvailableItems.push({
                    "id": dish._id,
                    "name": dish.name,
                    "price": dish.price,
                    "idwords": dish.idWords
                  })
                });

                if (listOfAvailableItems.length !== 0) {
                  for (let i = 0; i < listOfAvailableItems.length; i++) {
                    listOfAvailableItemsStringWritten = listOfAvailableItemsStringWritten + '\n' + ' - ' + listOfAvailableItems[i].name + '(' + listOfAvailableItems[i].idwords + ')';
                  }
                } else {
                  return res.json({
                    fulfillmentText: 'There are no restaurants by the name of ' + restaurant + ' in our database.',
                  });
                }

                let dishes = listOfAvailableItemsStringWritten != '' ? listOfAvailableItemsStringWritten : 'There are no items in this restaurant';

                //Adapt time variable to show only the necesary information
                var regExTime = /(?<=T)(.*?)(?=\+)/g;
                var regExDate = /(.*?)(?=T)/g;
                let time = regExTime.exec(datetime)[0];
                let timeWithoutSeconds = time.substring(0, time.length - 3);
                let date = regExDate.exec(datetime)[0];

                // Return response to user
                return res.json({
                  fulfillmentText: 'Great! Order will be placed at ' + restaurant + ' for ' + date + ' at ' + time + '.\n' +
                    'This restaurant contains the following available items (Id words between brackets):' + '\n' + dishes + '.',
                  outputContexts: [
                    {
                      name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_order_placed",
                      lifespanCount: 7,
                      parameters: {
                        "restaurantId": eId,
                        "restaurant": restaurant,
                        "date": date,
                        "time": timeWithoutSeconds,
                        "availableItems": listOfAvailableItems
                      }
                    }
                  ]
                });
              })
              .catch(err => {
                return res.json({
                  fulfillmentText: 'An error took place while recovering data from db ' + 'No establishment found with id ' + eId + ' ' + err
                });
              });
          }
        } else {
          return res.json({
            fulfillmentText: 'No establishment found with the name of ' + restaurant + ' ' + JSON.stringify(docs)
          });
        }
      })
      .catch(err => {
        return res.json({
          fulfillmentText: 'An error took place while recovering data from db ' + 'No establishment found with the name ' + restaurant + ' ' + err
        });
      });
  }
  else if (req.body.queryResult.intent.displayName == 'orderItems') {
    var contextMatched = false;
    var itemList;
    var selectedItemList = [];
    var restaurantId;
    var restaurant;
    var date;
    var time;

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
        if (context.parameters.restaurantId) {
          //Assign variable to the active order list
          restaurantId = context.parameters.restaurantId;
        }
        if (context.parameters.restaurant) {
          //Assign variable to the active order list
          restaurant = context.parameters.restaurant;
        }
        if (context.parameters.time) {
          //Assign variable to the active order list
          time = context.parameters.time;
        }
        if (context.parameters.date) {
          //Assign variable to the active order list
          date = context.parameters.date;
        }
        // Recover the list of previously selected items and push this item to the list
        if (context.parameters.selectedItems) {
          //Get all the previously selected items in a variable
          selectedItemList = context.parameters.selectedItems;
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

      for (let i = 0; i < wordList.length; i++) {
        //Irregular cases
        if (wordList[i].toLowerCase() === 'cookies') {
          wordList[i] = 'cookie';
        }
        else if (wordList[i].toLowerCase() === 'smoothies') {
          wordList[i] = 'smoothie';
        }
        else if (wordList[i].toLowerCase() === 'peperoni') {
          wordList[i] = 'peperoni';
        }
        else if (wordList[i].toLowerCase() === 'barbacoa') {
          wordList[i] = 'bbq';
        }
        else {
          //If it's a number, transform it into a word
          if (!isNaN(wordList[i])) {
            let num = parseInt(wordList[i]);
            wordList[i] = converter.toWords(num).toLowerCase();
          } else {
            wordList[i] = wordList[i].replace(
              new RegExp(`(${Object.keys(endings).join('|')})$`),
              r => endings[r]).toLowerCase();
          }
        }
      }

      //Check if the selected items are between the available options
      //For that, iterate all the items in itemList
      let selectedItem = null;
      itemList.forEach(item => {
        //If a wordlist includes all the idWords of this specific item, return the item, if not, return null
        if (item.idwords.every(word => wordList.includes(word))) {
          selectedItem = item;
        }
      });

      let response;

      //If an item was not selected
      if (selectedItem === null) {
        //Launch error but allow the selection to still be made
        response = 'An error took place trying to get the indicated item, said words ' + JSON.stringify(wordList) + ' available items ' + JSON.stringify(itemList) +
          '\n currently the selected items are the following: ';

        if (selectedItemList.length === 0) {
          response += 'No item has been selected yet.';
        } else {
          for (let j = 0; j < selectedItemList.length; j++) {
            response = response + selectedItemList[j].amount + ' - ' + selectedItemList[j].name;
          }
        }

        //Return response to user
        return res.json({
          fulfillmentText: response,
          outputContexts: [
            {
              name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/orderItems-followup",
              lifespanCount: 2,
              parameters: {
                "selectedItems": selectedItemList,
                "restaurantId": restaurantId,
                "restaurant": restaurant,
                "date": date,
                "time": time,
                "availableItems": itemList
              }
            }
          ]
        });

      } else {
        //If an item was selected, get specified amount
        let specifiedAmount = 1;
        if (req.body.queryResult.parameters.amount) {
          specifiedAmount = req.body.queryResult.parameters.amount;
        }

        selectedItemList.push({ "amount": specifiedAmount, "id": selectedItem.id, "name": selectedItem.name, "price": selectedItem.price });

        return res.json({
          fulfillmentText: 'You\'ve selected ' + specifiedAmount + ' item of ' + selectedItem.name + ', would you like to add any other item to this order?',
          outputContexts: [
            {
              name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/orderItems-followup",
              lifespanCount: 2,
              parameters: {
                "selectedItems": selectedItemList,
                "restaurantId": restaurantId,
                "restaurant": restaurant,
                "date": date,
                "time": time,
                "availableItems": itemList
              }
            }
          ]
        });

      }
    }

  }
  else if (req.body.queryResult.intent.displayName == 'moreItemsYes' || req.body.queryResult.intent.displayName == 'moreItemsNo') {
    var contextMatched = false;
    let availableItems;
    let selectedItemList = [];
    let selectedRestaurantId;
    let selectedRestaurant;
    let specifiedDate;
    let specifiedTime;
    var relevantContext;
    //Recover the list of active orders from context
    req.body.queryResult.outputContexts.forEach(context => {
      //The context of order items followup will contain selected Items
      if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/orderitems-followup") {
        contextMatched = true;
        relevantContext = context;
        // Recover the list of previously selected items and push this item to the list
        if (context.parameters.selectedItems) {
          //Get all the previously selected items in a variable
          selectedItemList = context.parameters.selectedItems;
        }

        //Find if the availableItems exists
        if (context.parameters.availableItems) {
          //Assign variable to the active order list
          availableItems = context.parameters.availableItems;
        }

        //Find if the restaurant exists
        if (context.parameters.restaurant) {
          //Assign variable to the active order list
          selectedRestaurant = context.parameters.restaurant;
        }
        //Get its id
        if (context.parameters.restaurantId) {
          //Assign variable to the active order list
          selectedRestaurantId = context.parameters.restaurantId;
        }

        //Find if the date exists
        if (context.parameters.date) {
          //Assign variable to the active order list
          specifiedDate = context.parameters.date;
        }

        //Find if the time exists
        if (context.parameters.time) {
          //Assign variable to the active order list
          specifiedTime = context.parameters.time;
        }
      }
    });

    //If context wasn't found, send a message to user
    if (!contextMatched) {
      return res.json({
        fulfillmentText: 'Some error with the context names took place, please try again.'
      });
    }
    else {
      //More items wan to be added
      if (req.body.queryResult.intent.displayName == 'moreItemsYes') {
        let listOfAvailableItemsString = '';
        if (availableItems.length !== 0) {
          for (let i = 0; i < availableItems.length; i++) {
            listOfAvailableItemsString = listOfAvailableItemsString + ' - ' + availableItems[i].name + '\n';
          }
        }

        let selectedItemListStr = '';
        for (let i = 0; i < selectedItemList.length; i++) {
          selectedItemListStr += selectedItemList[i].amount + '\n' + ' - ' + selectedItemList[i].name;
        }

        //Return to previous context with the restaurant related + datetime related + selected items info
        return res.json({
          fulfillmentText: 'The order in ' + selectedRestaurant + ' at ' + specifiedTime + ' on ' + specifiedDate + ' has the following items so far: ' +
            selectedItemListStr + '. \n' + 'Which one of the following list would you like to add to them? \n' + listOfAvailableItemsString,
          outputContexts: [
            {
              name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_order_placed",
              lifespanCount: 7,
              parameters: {
                "restaurantId": selectedRestaurantId,
                "restaurant": selectedRestaurant,
                "date": specifiedDate,
                "time": specifiedTime,
                "availableItems": availableItems,
                "selectedItems": selectedItemList
              }
            }
          ]
        });
      }

      //No more items want to be ordered
      else {
        let response;
        let totalCost = 0;
        let selectedItemListStr = '';
        //If no item was selected, the order can not be placed
        if (selectedItemList.length !== 0) {
          //Calculate total cost
          for (let i = 0; i < selectedItemList.length; i++) {
            totalCost = (parseFloat(totalCost) + parseFloat(selectedItemList[i].amount * selectedItemList[i].price, 10)).toFixed(2);
            selectedItemListStr += selectedItemList[i].amount + ' - ' + selectedItemList[i].name + '\n';
          }
          response = 'The order in ' + selectedRestaurant + ' at ' + specifiedTime + ' on ' + specifiedDate + ' has the following items: \n' +
            selectedItemListStr + '\n The total cost of this operation is ' + totalCost + '€. This process only allows payment by credit or debit card, therefore the following information is needed:\n' +
            'Card number, the month when the validity of the card ends and the CVC code (which you can find behind your card).'
        } else {
          response = 'No item was selected, no order can be placed.';
        }


        //No more items want to be added
        return res.json({
          fulfillmentText: response,
          outputContexts: [
            {
              name: "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_payment",
              lifespanCount: 5,
              parameters: {
                "restaurantId": selectedRestaurantId,
                "restaurant": selectedRestaurant,
                "date": specifiedDate,
                "time": specifiedTime,
                "availableItems": availableItems,
                "selectedItems": selectedItemList,
                "totalCost": totalCost
              }
            }
          ]
        });
      }

    }

  }
  /* ORDER RELATED ACTIONS - END */

  /* PAYMENT - START */
  else if (req.body.queryResult.intent.displayName == 'pay') {
    var creditCardNum = '';
    var expirationYear = '';
    var expirationMonth = '';
    var cvc = '';
    var cvc_Encrypted = '';
    var creditCardNum_Encrypted = '';
    var expirationMonth_Encrypted = '';
    var expirationYear_Encrypted = '';

    //Get the parameters of the credit card
    if (req.body.queryResult.parameters) {
      if (req.body.queryResult.parameters.cardNumber) {
        creditCardNum = req.body.queryResult.parameters.cardNumber.toString();
      }
      if (req.body.queryResult.parameters.expiration) {
        expirationMonth = req.body.queryResult.parameters.expiration;
      }
      if (req.body.queryResult.parameters.expirationYear) {
        expirationYear = req.body.queryResult.parameters.expirationYear.toString();
      }
      if (req.body.queryResult.parameters.cvc) {
        cvc = req.body.queryResult.parameters.cvc.toString();
      }

      if (cvc) {
        //Encrypt data
        cvc_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(cvc), KEY).toString();
        creditCardNum_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(creditCardNum), cvc).toString();
        expirationMonth_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(expirationMonth), cvc).toString();
        expirationYear_Encrypted = CryptoJS.AES.encrypt(JSON.stringify(expirationYear.substring(expirationYear.length - 2)), cvc).toString();
      }
    }

    //Recover parameters from context
    var contextMatched = false;
    let restaurant;
    let restaurantId;
    let date;
    let time;
    let selectedItemList = [];
    let totalCost;

    req.body.queryResult.outputContexts.forEach(context => {
      //The context of order items followup will contain selected Items
      if (context.name === "projects/" + PROJECT_ID + "/agent/sessions/" + SESSION_ID + "/contexts/await_payment") {
        contextMatched = true;
        // Recover the list of attributes from context
        if (context.parameters.restaurantId) {
          restaurantId = context.parameters.restaurantId;
        }
        if (context.parameters.restaurant) {
          restaurant = context.parameters.restaurant;
        }
        if (context.parameters.date) {
          date = context.parameters.date;
        }
        if (context.parameters.time) {
          time = context.parameters.time;
        }
        if (context.parameters.selectedItems) {
          selectedItemList = context.parameters.selectedItems;
        }
        if (context.parameters.totalCost) {
          totalCost = context.parameters.totalCost;
        }
      }
    });


    if (contextMatched) {
      //Save all the information in db
      const order = new Order({
        totalCost: totalCost,
        orderDate: date,
        orderTime: time,
        rating: 0,
        userEmail: userInformationJSON.email,
        status: 'Active',
        establishmentId: restaurantId
      });
      order.save()
        .then(dbOrder => {
          if (dbOrder._id) {
            let orderLines = [];
            for (let i = 0; i < selectedItemList.length; i++) {
              const orderLine = new OrderLine({
                amount: selectedItemList[i].amount,
                orderId: dbOrder._id,
                dishId: selectedItemList[i].id
              });
              orderLines.push(orderLine);
            }
            const orderLineItems = new OrderLineList({
              data: orderLines
            });

            orderLineItems.save()
              .then(dbOrderLineList => {
                CreditCard.findOneAndUpdate(
                  { email: userInformationJSON.email },
                  {
                    $set: {
                      cardNumber: creditCardNum_Encrypted,
                      expirationMonth: expirationMonth_Encrypted,
                      expirationYear: expirationYear_Encrypted,
                      cvc: cvc_Encrypted,
                      name: userInformationJSON.name,
                      email: userInformationJSON.email
                    }
                  }, { upsert: true }).exec().then(cardSuccess => {
                    return res.json({
                      fulfillmentText: 'Nice! You have just paid your order, you will shortly receive an email with the information of your transaction.'
                    });
                  }).catch(cardError => {
                    return res.json({
                      fulfillmentText: 'Error took place saving the card information: ' + JSON.stringify(cardError)
                    });
                  });

              }).catch(e => {
                return res.json({
                  fulfillmentText: 'Error took place while creating the order lines: ' + JSON.stringify(e)
                });
              });
          }
        })
        .catch(error => {
          return res.json({
            fulfillmentText: 'Error took place while creating the order: ' + JSON.stringify(selectedItemList)
          });
        });
    } else {
      return res.json({
        fulfillmentText: 'It seems that an error took place trynig to recover the paying information.'
      });
    }
    //Call external API and make payment
    //Call external API to send an email
  }
  /* PAYMENT - END */


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


