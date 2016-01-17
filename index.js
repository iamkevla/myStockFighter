/**
 * Level 1 bot
 *
 * place an order for 100 units to succeed
 *
 */

var _ = require('lodash');
var Stockfighter = require('stockfighter-js');
var Promise = require('bluebird'); //jshint ignore:line


var config = require('./config.json');
var client = new Stockfighter.Client(config.apiKey);
var account = new Stockfighter.Account(config.apiKey, config.account, config.venue);

var stock = config.stock;
var quotes = [];

const GET_QUOTE_INTERVAL = 1000;
const SAMPLE_SIZE = 20;


function getQuote() {
    account.getQuote(stock)
        .then(function(quote) {
            quotes.push(quote);
        });
}

var log = setInterval(getQuote, GET_QUOTE_INTERVAL);

function stopLog() {
    clearInterval(log);
}



Array.observe(quotes, function() {
    if (quotes.length === SAMPLE_SIZE) {
        // algorithm used to set buy price
        var price = parseInt((_.minBy(quotes, 'ask').ask + _.minBy(quotes, 'bid').bid) / 2, 10);
        quotes.splice(0, 10);

        var orderId;
        /**
         * Buy some stock at predefined
         */
        account
            .limitBuy({
                stock: stock,
                price: price,
                quantity: 100
            })
            .then(function checkStatus(order) {
                orderId = order.id;
                console.log('Order Placed', order);
                return account.getOrderStatus(stock, order.id);
            })
            .then(function(resp) {
                if (!resp.open) {
                    stopLog();
                    console.log('order completed', resp);
                } else {
                    //After ten seconds check status and cancel order if still open
                    setTimeout(function() {
                        //Check status of order is still open
                        account.getOrderStatus(stock, orderId).then(function(resp) {
                            console.log(['order status open :', resp.open]);
                            if (resp.open) {
                                //Cancel the order
                                account.cancelOrder(stock, orderId)
                                    .then(function(response) {
                                        console.log('order cancelled');
                                    })
                                    .catch(function(err) {
                                        console.log(err, ' ERROR');
                                    });

                            } else {
                                stopLog();
                                console.log('order completed', resp);
                            }

                        });

                    }, 5000);

                }
            });

    } else if (quotes.length >= 1) {
        console.log([quotes.length, _.minBy(quotes, 'ask') ? _.minBy(quotes, 'ask').ask : void(0)]);
    }
});
