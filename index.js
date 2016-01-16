/**
 * Level 1 bot
 *
 * place an order for 100 units to succeed
 *
 */

var _ = require('lodash');
var Stockfighter = require('stockfighter-js');


var config = require('./config.json');
var client = new Stockfighter.Client(config.apiKey);
var account = new Stockfighter.Account(config.apiKey, config.account, config.venue);

var stock = config.stock;


var quotes = [];


//function doSomething() {
//    console.log(new Date());
//}

function getQuote() {
    account.getQuote(stock).then(function(quote) {
        quotes.push(quote);
    });
}

var log = setInterval(getQuote, 1000);

function stopLog() {
    clearInterval(log);
}

setTimeout(stopLog, 11000);

Array.observe(quotes, function() {
    if (quotes.length === 10) {
        var price = _.minBy(quotes, 'last').last;

        var myOrder = {
            stock: stock,
            price: price,
            quantity: 100
        };

        var orderId;
        /**
         * Buy some stock at predefined
         */
        account.limitBuy(myOrder)
            .then(function onOrder(order) {
                orderId = order.id;
                console.log(['order placed', orderId, order.price]);
                return order.id;
            })
            .then(function checkStatus(id) {
                return account.getOrderStatus(stock, id);
            });


        /**
         * After ten seconds cancel the order
         */
        setTimeout(function() {

            /**
             *  Check status of order is still open
             */
            account.getOrderStatus(stock, orderId).then(function(resp) {
                console.log(['order status open :', resp.open]);
                if (resp.open) {
                    /**
                     * Cancel the order
                     */
                    account.cancelOrder(stock, orderId).then(function(response) {
                        console.log('order cancelled');
                    });

                } else {
                  console.log('order completed', resp);
                }

            });

        }, 10000);


    }
});

