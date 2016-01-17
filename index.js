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
const ORDER_CHECK_INTERVAL = 5000;
const ORDER_QUANTITY = 100;
const SAMPLE_TRUNCATE = 10;


var log = setInterval(getQuote, GET_QUOTE_INTERVAL);

Array.observe(quotes, function() {
    var orderId;

    if (quotes.length === SAMPLE_SIZE) {
        // algorithm used to set buy price
        var price = parseInt((_.minBy(quotes, 'ask').ask + _.minBy(quotes, 'bid').bid) / 2, 10);
        quotes.splice(0, SAMPLE_TRUNCATE);


        /**
         * Buy some stock at predefined
         */
        account
            .limitBuy({
                stock: stock,
                price: price,
                quantity: ORDER_QUANTITY
            })
            .then(function checkStatus(order) {
                orderId = order.id;
                console.log('Order Placed', order.id, order.price);
                return account.getOrderStatus(stock, order.id);
            })
            .then(function(resp) {
                return new Promise(function(resolve, reject) {

                    if (!resp.open) {
                        cleanupOnCompletion();
                    } else {
                        //After ten seconds check status and cancel order if still open
                        setTimeout(function() {
                            //Check status of order is still open
                            account.getOrderStatus(stock, orderId).then(function(resp) {

                                if (resp.open) {

                                    account.cancelOrder(stock, orderId)
                                        .then(cancelSuccessHandler)
                                        .catch(errorHandler);
                                } else {
                                    cleanupOnCompletion();
                                }

                                function cancelSuccessHandler(response) {
                                    console.log('order cancelled');
                                    resolve();
                                }

                                function errorHandler(err) {
                                    console.log(err, ' ERROR');
                                    reject(err);
                                }

                            });

                        }, ORDER_CHECK_INTERVAL);


                    }

                    function cleanupOnCompletion() {
                        stopLog();
                        resolve();
                        console.log('order completed', resp);
                    }
                });

            })
            .catch(function() {
                console.log('There was an error!!');
            });

    } else if (quotes.length >= 1) {
        process.stdout.write('.');
        //console.log([quotes.length, _.minBy(quotes, 'ask') ? _.minBy(quotes, 'ask').ask : void(0)]);
    }
});

function stopLog() {
    clearInterval(log);
}

function pushQuote(quote) {
    quotes.push(quote);
}

function getQuote() {
    account.getQuote(stock).then(pushQuote);
}
