"use strict";

//let http = require('http')
let request = require('request')

let token = "CAAWepUeh2pIBABN3nZCZCYDpxSz5SZAw7wEULdZBFAo87vwCrqXd1bD4hFN0w35EahRkbNQyiLWXWfLdXhNY3DVdNRAQbBv3wKRenN3TfGgELFHXvnSpSjj4B1r4RUjeW1WSPAxrLv8K6Wsgow9AZC0ZB5axtYXTvjfm7ZAtybZBZBy0GYXoTCMDUprjY6eOF9aQZD"
//let token = 'a'

function sendTextMessage(sender, text) {

	console.log('Trying to sendTextMessage', text)

	let messageData = {
		text: text
	}
	let np = new Promise((resolve, reject) => {
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: token },
			method: 'POST',
			json: {
				recipient: { id: sender },
				message: messageData,
			}
		}, function (error, response, body) {
			if (error) {
				console.log('Error sending message: ', error);
				reject();
			} else if (response.body.error) {
				console.log('Error: ', response.body.error);
				reject();
			} else {
				console.log('Responded to user', sender, 'with text', text)
				resolve();
			}
		});
	})
	
	return np;
}

module.exports = sendTextMessage;