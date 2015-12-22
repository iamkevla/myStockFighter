var Stockfighter = require('stockfighter-js');


var config = require('./config.json');
var account = new Stockfighter.Account(config.apiKey,  config.account, config.venue);
 
var stock = 'AULY';
var myOrder = {
  stock: stock,
  price: 2000,
  quantity: 100
};

var orderId;
 /**
  * Buy some stock at predefined 
  */
account.limitBuy(myOrder)
  .then(function onOrder(order) {
    orderId = order.id; 
    console.log(['order placed', orderId]);
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
      account.getOrderStatus(stock, orderId).then(function(resp){
          console.log(['order status', resp]);
          if (resp.open) {
            /**
             * Cancel the order 
             */
            account.cancelOrder (stock, orderId).then(function(response){
                console.log(['order cancelled'], response)
            });
          
          }
          
      })

  }, 10000);