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
},
{ usePushEach: true });

const orderSchema = new Schema({
  buyerId: {type: String, required: true},
  orderItemsId: {type: String, required: true, unique: true},
  deliveryLocation: {type: String, required: true},
  status: {type: String, default: 'pending'},
  travelerId: {type: String, default: null},
  packageId: {type: String},
  processedAt: {type: Date, default: Date.now()},
  createdAt: {type: Date, default: Date.now()},
  updatedAt: {type: Date, default: Date.now()}
},
{ usePushEach: true });

const invoiceSchema = new Schema({
  buyerId: { type: String, required: true },
  orderId: { type: String, required: true },
  items: [itemSchema],
  fee: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'unpaid' },
  createdAt: {type: Date, default: Date.now()}
},
{ usePushEach: true });

const cartSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  invoice: [invoiceSchema],
  itemIds: [{type: String}]
},
{ usePushEach: true });

const notificationSchema = new Schema({
  type: { type: String, default: 'package' },
  subject: { type: String, required: true },
  orderId: { type: String },
  invoiceId: { type: String },
  items: [itemSchema],
  details: { type: String, required: true },
  status: { type: String, default: 'active' },
  createdAt: {type: Date, default: Date.now()}
},
{ usePushEach: true });

const packageSchema = new Schema({
  travelerId: {type: String, required: true},
  orderId: {type: String, required: true},
  items: [itemSchema],
  status: {type: String, default: 'In Transit'},
  createdAt: {type: Date, default: Date.now()}
},
{ usePushEach: true });

const knutsfordItemsSchema = new Schema({
  orderId: {type: String, required: true},
  createdAt: {type: Date, default: Date.now()}
},
{ usePushEach: true });

const item_model = mongoose.model('item', itemSchema);
const cart_model = mongoose.model('cart', cartSchema);
const order_model = mongoose.model('order', orderSchema);
const invoice_model = mongoose.model('invoice', invoiceSchema);
const orderItems_model = mongoose.model('orderItems', orderItemsSchema);
const package_model = mongoose.model('package', packageSchema);
const notif_model = mongoose.model('notification', notificationSchema);
const knutsford_items_model = mongoose.model('knutsfordItems', knutsfordItemsSchema);

module.exports.item = item_model;
module.exports.cart = cart_model;
module.exports.order = order_model;
module.exports.invoice = invoice_model;
module.exports.orderItems = orderItems_model;
module.exports.notification = notif_model;
module.exports.package = package_model;
module.exports.knutsfordItems = knutsford_items_model;
