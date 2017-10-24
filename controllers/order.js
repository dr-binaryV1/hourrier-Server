const OrderModels = require('../models/order');
const Cart = OrderModels.cart;

exports.cart = (req, res, next) => {
  Cart.findOne({"userId": req.get('user')}, null, (err, cart) => {
    if(err) { return next(err); }
    console.log(cart);
    res.json(cart);
  })
};