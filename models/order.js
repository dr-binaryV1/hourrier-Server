const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  description: {type: String, required: true },
  details: { type: String, required: true },
  image: { type: String, required: true },
  url: {type: String, required: true }
});

const orderItemsSchema = new Schema({
  itemIds: [{type: String}]
});

const orderSchema = new Schema({
  buyerId: {type: String, required: true},
  orderItemsId: {type: String, required: true, unique: true}
});

const cartSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  itemIds: [{type: String}]
});

const item_model = mongoose.model('item', itemSchema);
const cart_model = mongoose.model('cart', cartSchema);
const order_model = mongoose.model('order', orderSchema);
const orderItems_model = mongoose.model('orderItems', orderItemsSchema);

module.exports.item = item_model;
module.exports.cart = cart_model;
module.exports.order = order_model;
module.exports.orderItems = orderItems_model;