const OrderModels = require('../models/order');
const UserModels = require('../models/user');

const User = UserModels.user;
const Itinerary = UserModels.travelItinerary;
const Package = OrderModels.package;
const Items = OrderModels.item;

exports.packageData = (req, res, next) => {
  Package.findOne({"_id": req.body.packageId}, null, (err, pkg) => {
    if(err) { return next(err) }

    User.findOne({"_id": pkg.travelerId}, null, (err, usr) => {
      if(err) { return next(err) }

      Itinerary.findOne({"_id": usr.itineraryIds.map(id => { return id })}, null, (err, itinerary) => {
        if(err) { return next(err) }

        res.json({ pkg, usr, itinerary });
      });
    });
  });
};