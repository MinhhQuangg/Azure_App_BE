const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
const transConfig = require('../config/trans.config');

let key = transConfig.key;
let endpoint = "https://api.cognitive.microsofttranslator.com";

let location = transConfig.location;

const translate = async (fromLang, toLang, text) => {
    try {
        const response = await axios({
            baseURL: endpoint,
            url: '/translate',
            method: 'post',
            headers: {
                'Ocp-Apim-Subscription-Key': key,
                'Ocp-Apim-Subscription-Region': location,
                'Content-type': 'application/json',
                'X-ClientTraceId': uuidv4().toString()
            },
            params: {
                'api-version': '3.0',
                'from': fromLang,
                'to': toLang
            },
            data: [{
                'text': text
            }],
            responseType: 'json'
        });

        console.log("Translation response:", JSON.stringify(response.data, null, 4));
        return response.data;

    } catch (err) {
        if (err.response) {
            console.error("API Error:");
        } else if (err.request) {
            console.error("No Response from API:");
        } else {
            console.error("Request Error:");
        }
        throw err; // Re-throw for further debugging or handling
    }
};

module.exports = translate;