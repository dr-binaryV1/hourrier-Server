const jwt = require('jwt-simple');
const UserModels = require('../models/user');
const OrderModels = require('../models/order');
const config = require('../config');
const User = UserModels.user;
const Cart = OrderModels.cart;
const Traveler = UserModels.traveler;
const Shipping = UserModels.shipping;

function tokenForUser(user) {
  // sub => Subject, iat => Issue at time
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
}

exports.signin = (req, res, next) => {
  // User has already had their email and password auth'd
  // We just need to give them a token
  res.send({ token: tokenForUser(req.user), user: req.user });
};

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
      email: user.email
    }
    res.json(data);
  })
}

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
  })
}

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
    })
  })
}

exports.signup = (req, res, next) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const username = req.body.username;
  const address1 = req.body.address1;
  const address2 = req.body.address2;
  const city = req.body.city;
  const country = req.body.country;
  const zip = req.body.zip;
  const email = req.body.email;
  const password = req.body.password;
  const userTypeId = req.body.userTypeId;

  if(!email || !password) {
    return res.status(422).json({ error: 'You must provide email and password' });
  }

  // See if a user wth the given email exists
  User.findOne({ email: email }, function(err, existingUser) {

    if(err) { return next(err); }

    // If a user with email does exist, return an error
    if(existingUser) {
      // 422 rsponse means unprocessable request
      return res.status(422).json({ error: 'Email already existed' });
    }

    // If a user with email !exist, create and save user record
    const user = new User({
      username,
      firstname,
      lastname,
      email,
      password,
      mailingAddress1: address1,
      mailingAddress2: address2,
      mailingCity: city,
      mailingZip: zip,
      mailingCountry: country,
      userTypeId
    });

    user.save((err, user) => {
      if (err) { return next(err); }
      const cart = new Cart({
          userId: user._id,
          itemIds: []
      });

      cart.save((err, cart) => {
        if(err) { return next(err); }
        // Respond to request indicating success
        res.json({ token: tokenForUser(user), user: user });
      });
    });
  });
};
