const multer = require('multer');
const UserModels = require('../models/user');
const OrderModels = require('../models/order');
const User = UserModels.user;
const Cart = OrderModels.cart;
const Traveler = UserModels.traveler;
const Shipping = UserModels.shipping;
const Itinerary = UserModels.travelItinerary;
const Storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, `${__dirname}/itineraries`);
  },
  filename: function (req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage: Storage }).array("imgUploader", 3); //Field name and max count

exports.getUser = (req, res, next) => {
  User.findOne({"_id": req.get('userId')}, null, (err, user) => {
    if(err) { return next(err); }

    const data = {
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      mailingAddress1: user.mailingAddress1,
      mailingAddress2: user.mailingAddress2,
      mailingCity: user.mailingCity,
      mailingCountry: user.mailingCountry,
      userTypeId: user.userTypeId,
      itineraryIds: user.itineraryIds,
      role: user.role,
      notificationIds: user.notificationIds,
      packageIds: user.packageIds,
      primaryShippingAddress: user.primaryShippingAddress,
      shippingAddressIds: user.shippingAddressIds,
      traveler: user.traveler,
      email: user.email
    };
    res.json(data);
  });
};

exports.addShipping = (req, res, next) => {
  const shipping = new Shipping({
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    shippingCity: req.body.shippingCity,
    shippingCountry: req.body.shippingCountry,
    shippingZip: req.body.shippingZip
  });

  shipping.save((err, shipping) => {
    if(err) { return next(err); }

    User.findOne({"_id": req.get('user')}, null, (err, user) => {
      if(err) { return next(err); }

      user.shippingAddressIds.push(shipping._id);
      if(user.shippingAddressIds.length === 1) {
        user.primaryShippingAddress = shipping._id
      }
      user.save((err, user) => {
        if(err) { return next(err); }

        const data = {
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          mailingAddress1: user.mailingAddress1,
          mailingAddress2: user.mailingAddress2,
          mailingCity: user.mailingCity,
          mailingCountry: user.mailingCountry,
          userTypeId: user.userTypeId,
          traveler: user.traveler,
          role: user.role,
          itineraryIds: user.itineraryIds,
          notificationIds: user.notificationIds,
          packageIds: user.packageIds,
          primaryShippingAddress: user.primaryShippingAddress,
          shippingAddressIds: user.shippingAddressIds,
          email: user.email
        }

        Shipping.find({"_id": data.shippingAddressIds.map(id => {return id})}, null, (err, addresses) => {
          if(err) { return next(err); }

          res.json({user: data, addresses});
        });
      });
    });
  });
};

exports.addItinerary = (req, res, next) => {
  const itinerary = new Itinerary({
    departureCity: req.body.departureCity,
    departureDate: req.body.departureDate,
    departureTime: req.body.departureTime,
    arrivalCity: req.body.arrivalCity,
    arrivalDate: req.body.arrivalDate,
    arrivalTime: req.body.arrivalTime,
    flightNo: req.body.flightNo
  });

  itinerary.save((err, itinerary) => {
    if(err) { return next(err); }

    User.findOne({"_id": req.get('user')}, null, (err, user) => {
      if(err) { return next(err); }

      user.itineraryIds.push(itinerary._id);
      user.save((err, user) => {
        if(err) { return next(err); }

        const data = {
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          mailingAddress1: user.mailingAddress1,
          mailingAddress2: user.mailingAddress2,
          mailingCity: user.mailingCity,
          mailingCountry: user.mailingCountry,
          userTypeId: user.userTypeId,
          traveler: user.traveler,
          role: user.role,
          itineraryIds: user.itineraryIds,
          notificationIds: user.notificationIds,
          packageIds: user.packageIds,
          primaryShippingAddress: user.primaryShippingAddress,
          shippingAddressIds: user.shippingAddressIds,
          email: user.email
        };

        Itinerary.find({"_id": data.itineraryIds.map(id => {return id})}, null, (err, itineraries) => {
          if(err) { return next(err); }

          res.json({user: data, itineraries});
        });
      });
    });
  });
};

exports.uploadItinerary = (req, res, next) => {
  upload(req, res, (err) => {
    if(err) { return next(err); }

    return res.json({msg: "succeeded"});
  });
};

exports.changePrimaryShipping = (req, res, next) => {
  User.findOne({"_id": req.get('user')}, null, (err, user) => {
    if(err) { return next(err); }

    user.primaryShippingAddress = req.body.primaryShippingAddress;
    user.save((err, user) => {
      if(err) { return next(err); }
      res.json(user);
    });
  });
};

exports.getShippingAddress = (req, res, next) => {
  Shipping.find({"_id": req.body.shippingIds.map(id => {return id})}, null, (err, address) => {
    if(err) { return next(err); }
    res.json({shippingAddress: address });
  });
};

exports.getTravelItinerary = (req, res, next) => {
  Itinerary.find({"_id": req.body.itineraryIds.map(id => {return id})}, null, (err, itineraries) => {
    if(err) { return next(err); }
    res.json({travelItinerary: itineraries });
  });
};

exports.removeTravelItinerary = (req, res, next) => {
  Itinerary.remove({"_id": req.body.itineraryId}, (err) => {
    if(err) { return next(err); }

    User.findOne({"_id": req.get('user')}, null, (err, user) => {
      if(err) { return next(err); }

      user.itineraryIds = user.itineraryIds.filter(id => {
        return id !== req.body.itineraryId;
      });

      Itinerary.find({"_id": user.itineraryIds.map(id => {return id})}, (err, itineries) => {
        if(err) { return next(err); }

        user.save((err, user) => {
          if(err) { return next(err); }
          res.json({user, itineries});
        });
      });
    });
  });
};

exports.removeShippingAddress = (req, res, next) => {
  Shipping.remove({"_id": req.body.addressId}, (err) => {
    if(err) { return next(err); }

    User.findOne({"_id": req.get('user')}, null, (err, user) => {
      if(err) { return next(err); }

      user.shippingAddressIds = user.shippingAddressIds.filter(id => {
        return id !== req.body.addressId;
      });
      if(user.primaryShippingAddress === req.body.addressId) {
        user.primaryShippingAddress = '';
      }

      Shipping.find({"_id": user.shippingAddressIds.map(id => {return id})}, null, (err, addresses) => {
        if(err) { return next(err); }

        user.save((err, user) => {
          if(err) { return next(err); }
          res.json({user, addresses});
        });
      });
    });
  });
};

exports.updateUser = (req, res, next) => {
  User.findOne({"_id": req.get('userId')}, null, (err, user) => {
    if(err) { return next(err); }

    user.username = req.body.username;
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    user.email = req.body.email;
    user.mailingAddress1 = req.body.mailingAddress1;
    user.mailingAddress2 = req.body.mailingAddress2;
    user.mailingCity = req.body.mailingCity;
    user.mailingCountry = req.body.mailingCountry;

    user.save((err, user) => {
      if(err) { return next(err); }

      const data = {
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        mailingAddress1: user.mailingAddress1,
        mailingAddress2: user.mailingAddress2,
        mailingCity: user.mailingCity,
        mailingCountry: user.mailingCountry,
        userTypeId: user.userTypeId,
        itineraryIds: user.itineraryIds,
        role: user.role,
        notificationIds: user.notificationIds,
        packageIds: user.packageIds,
        primaryShippingAddress: user.primaryShippingAddress,
        shippingAddressIds: user.shippingAddressIds,
        traveler: user.traveler,
        email: user.email
      };
      res.json(data);
    });
  });
};

exports.updateTravelerStatus = (req, res, next) => {
  User.findOne({"_id": req.get('userId')}, null, (err, user) => {
    if(err) { return next(err); }

    user.traveler = req.body.status;
    user.save((err, user) => {
      if(err) { return next(err); }
      res.json(user);
    });
  });
};

exports.deleteNotification = (req, res, next) => {
  User.findOne({"_id": req.get('userId')}, null, (err, user) => {
    if(err) { return next(err); }

    user.notificationIds = user.notificationIds.filter(id => {
      return id !== req.body.notificationId
    });

    user.save((err, user) => {
      if(err) { return next(err); }

      res.json({user});
    });
  });
};

exports.deleteAllNotifications = (req, res, next) => {
  User.findOne({"_id": req.get('userId')}, null, (err, user) => {
    if(err) { return next(err); }

    user.notificationIds = [];

    user.save((err, user) => {
      if(err) { return next(err); }

      res.json({user});
    });
  });
};
