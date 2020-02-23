'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const API_KEY = require('./apiKey');

const restService = express();
restService.use(
    bodyParser.urlencoded({
        extended: true
    })
);

restService.use(bodyParser.json());

restService.post('/post-pedido', (request, response) => {

    var response = '';

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
        fulfillmentText: 'Respuesta por defecto',
        speech: speechResponse,
        displayText: speechResponse,
        source: ''
    
    });
});

restService.listen((process.env.PORT || 8000), () => {
    console.log("restService is up and running...");
});



/*const movieToSearch = request.body.result && request.body.result.parameters && request.body.result.parameters.movie ? request.body.result.parameters.movie : 'The Godfather';
const reqUrl = encodeURI(`http://www.omdbapi.com/?t=${movieToSearch}&apikey=${API_KEY}`);
http.get(reqUrl, (responseFromAPI) => {
    let completeResponse = '';
    responseFromAPI.on('data', (chunk) => {
        completeResponse += chunk;
    });
    responseFromAPI.on('end', () => {
        const movie = JSON.parse(completeResponse);
        let dataToSend = movieToSearch === 'The Godfather' ? `I don't have the required info on that. Here's some info on 'The Godfather' instead.\n` : '';
        dataToSend += `${movie.Title} is a ${movie.Actors} starer ${movie.Genre} movie, released in ${movie.Year}. It was directed by ${movie.Director}`;

        return res.json({
            speech: dataToSend,
            displayText: dataToSend,
            source: 'get-movie-details'
        });
    });
}, (error) => {
    return res.json({
        speech: 'Something went wrong!',
        displayText: 'Something went wrong!',
        source: 'get-movie-details'
    });
});*/