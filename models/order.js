const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: String },
  description: {type: String },
  details: { type: String },
  image: { type: String, required: true },
  url: {type: String, required: true }
});

const orderItemsSchema = new Schema({
  itemIds: [{type: String}]
});

const orderSchema = new Schema({
  buyerId: {type: String, required: true},
  orderItemsId: {type: String, required: true, unique: true},
  status: {type: String, default: 'pending'},
  travelerId: {type: String}
});

const cartSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  itemIds: [{type: String}]
});

const orderNotificationSchema = new Schema({
  subject: { type: String, required: true },
  orderId: { type: String, required: true },
  items: [itemSchema],
  details: { type: String, required: true },
  status: { type: String, default: 'active' }
});

const item_model = mongoose.model('item', itemSchema);
const cart_model = mongoose.model('cart', cartSchema);
const order_model = mongoose.model('order', orderSchema);
const orderItems_model = mongoose.model('orderItems', orderItemsSchema);
const order_notif_model = mongoose.model('orderNotification', orderNotificationSchema);

module.exports.item = item_model;
module.exports.cart = cart_model;
module.exports.order = order_model;
module.exports.orderItems = orderItems_model;
module.exports.orderNotification = order_notif_model;
