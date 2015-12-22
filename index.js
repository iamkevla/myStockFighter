var Stockfighter = require('stockfighter-js');


var config = require('./config.json');
var account = new Stockfighter.Account(config.apiKey,  config.account, config.venue);
 
var stock = 'IAR';
var myOrder = {
  stock: stock,
  price: 13000,
  quantity: 100
};
 
account.limitBuy(myOrder)
  .then(function onOrder(order) {
    return order.id;
  })
  .then(function checkStatus(id) {
    return account.getOrderStatus(stock, id);
  });