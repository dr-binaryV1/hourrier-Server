const OrderModels = require('../models/order');
const UserModels = require('../models/user');
const KnutsfordItem = require('../models/order').knutsfordItems;

const User = UserModels.user;
const Itinerary = UserModels.travelItinerary;
const Package = OrderModels.package;
const Items = OrderModels.item;
const Order = OrderModels.order;

exports.getKnutsfordItems = (req, res, next) => {
  KnutsfordItem.find({}, null, (err, k_items) => {
    if (err) { return next(err); }

    Order.find({ "_id": k_items.map(item => { return item.orderId }) }, null, (err, orders) => {
      if (err) { return next(err); }

      res.json({ orders });
    });
  });
};

exports.packageData = (req, res, next) => {
  Package.findOne({ "_id": req.body.packageId }, null, (err, pkg) => {
    if (err) { return next(err) }

    User.findOne({ "_id": pkg.travelerId }, null, (err, usr) => {
      if (err) { return next(err) }

      Itinerary.findOne({ "_id": usr.itineraryIds.map(id => { return id }) }, null, (err, itinerary) => {
        if (err) { return next(err) }

        res.json({ pkg, usr, itinerary });
      });
    });
  });
};