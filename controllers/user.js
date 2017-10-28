const UserModels = require('../models/user');
const OrderModels = require('../models/order');
const User = UserModels.user;
const Cart = OrderModels.cart;
const Traveler = UserModels.traveler;
const Shipping = UserModels.shipping;

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
      mailingZip: user.mailingZip,
      userTypeId: user.userTypeId,
      intineraryIds: user.intineraryIds,
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
      user.shippingAddressIds.push(shipping._id);
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
          mailingZip: user.mailingZip,
          userTypeId: user.userTypeId,
          intineraryIds: user.intineraryIds,
          shippingAddressIds: user.shippingAddressIds,
          email: user.email
        }
        res.json(data);
      });
    });
  });
};

exports.getShippingAddress = (req, res, next) => {
  Shipping.find({"_id": req.body.shippingIds.map(id => {return id})}, null, (err, address) => {
    if(err) { return next(err); }
    res.json({shippingAddress: address });
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

      user.save((err, user) => {
        if(err) { return next(err); }
        res.json(user);
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
    user.mailingZip = req.body.mailingZip;

    user.save((err, user) => {
      if(err) { return next(err); }
      res.json(user);
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
