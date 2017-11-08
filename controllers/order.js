const OrderModels = require('../models/order');
const UserModels = require('../models/user');
const User = UserModels.user;
const Itinerary = UserModels.travelItinerary;
const Cart = OrderModels.cart;
const Item = OrderModels.item;
const Product = OrderModels.item;
const OrderItems = OrderModels.orderItems;
const OrderNotification = OrderModels.orderNotification;
const Order = OrderModels.order;

exports.cart = (req, res, next) => {
  Cart.findOne({"userId": req.get('user')}, null, (err, cart) => {
    if(err) { return next(err); }
    res.json(cart);
  });
};

exports.addItem = (req, res, next) => {
  const item = new Product({
    name: req.body.title,
    price: req.body.price,
    description: req.body.description,
    details: req.body.details,
    image: req.body.image,
    url: req.body.url
  });

  item.save((err, item) => {
    if (err) { return next(err); }

    Cart.findOne({"userId": req.get('user')}, null, (err, cart) => {
      if(err) { return next(err); }

      cart.itemIds.push(item._id);
      cart.save((err, cart) => {
        if (err) { return next(err); }
        res.json(cart);
      });
    });
  });
};

exports.getItem = (req, res, next) => {
  Item.find({"_id": req.body.itemIds.map(id => {return id})}, null, (err, items) => {
    if(err) { return next(err); }
    res.json({ items: items });
  });
};

exports.checkItem = (req, res, next) => {
  Cart.findOne({"userId": req.get('user')}, null, (err, cartItems) => {
    if(err) { return next(err); }

    Item.find({"_id": cartItems.itemIds.map(id => {return id})}, null, (err, items) => {
      if(err) { return next(err); }
      let filteredItems = items.filter(item => {
        return item.name === req.body.itemName
      });

      filteredItems.length > 0 ? res.json({ itemFound: true }) : res.json({ itemFound: false });
    });
  });
};

exports.removeItem = (req, res, next) => {
  Cart.findOne({"userId": req.get('user')}, null, (err, cart) => {
    if(err) { return next(err); }

    cart.itemIds = cart.itemIds.filter((id) => {
      return id !== req.body.itemId;
    });

    cart.save((err, cart) => {
      if(err) { return next(err); }

      Item.remove({"_id": req.body.itemId}, (err) => {
        if(err) { return next(err); }
        Item.find({}, null, (err, items) => {
          if(err) { return next(err); }
          res.json(items);
        });
      });
    });
  });
};

exports.checkout = (req, res, next) => {
  const orderItems = new OrderItems({
    itemIds: req.body.itemIds
  });

  orderItems.save((err, items) => {
    if(err) { return next(err); }

    const order = new Order({
      buyerId: req.get('user'),
      orderItemsId: items._id
    });

    order.save((err, order) => {
      if(err) { return next(err); }

      Cart.findOne({"userId": req.get('user')}, null, (err, cart) => {
        cart.itemIds = [];
        cart.save((err, cart) => {
          if(err) { return next(err); }
          res.json({ itemIds: cart.itemIds });
        });
      });
    });
  });
};

exports.getOrders = (req, res, next) => {
  Order.find({}, null, (err, orders) => {
    if(err) { return next(err); }
    res.json({orders});
  });
};

exports.getOneOrder = (req, res, next) => {
  Order.findOne({"_id": req.body.orderId}, null, (err, order) => {
    if(err) { return next(err); }

    OrderItems.findOne({"_id": order.orderItemsId}, null, (err, orderItems) => {
      if(err) { return next(err); }

      Item.find({"_id": orderItems.itemIds.map(id => { return id })}, null, (err, items) => {
        if(err) { return next(err); }

        User.findOne({"_id": order.buyerId}, null, (err, user) => {
          if(err) { return next(err); }

          const data = {
            firstname: user.firstname,
            lastname: user.lastname,
            mailingAddress1: user.mailingAddress1,
            mailingAddress2: user.mailingAddress2,
            mailingCity: user.mailingCity,
            mailingCountry: user.mailingCountry,
            mailingZip: user.mailingZip,
            email: user.email
          };

          res.json({items, buyer: data, status: order.status});
        });
      });
    });
  });
};

exports.findTravelers = (req, res, next) => {
  const notif = new OrderNotification({
    subject: 'You have a package request',
    items: req.body.items,
    details: `This package contains ${req.body.items.length} item(s)`
  });

  notif.save((err, notification) => {
    if(err) { return next(err); }

    Order.findOne({"_id": req.body.orderId}, null, (err, order) => {
      if(err) { return next(err); }

      order.status = 'locating travelers';
      order.save((err, order) => {
        if(err) { return next(err); }

        User.find({"traveler": true}, null, (err, users) => {
          if(err) { return next(err); }

          let availableTravelerCount = 0;
          users.map(user => {
            Itinerary.find({"_id": user.itineraryIds.map(id => { return id })}, null, (err, itineraries) => {
              if(err) { return next(err); }
              availableTravelerCount++;
              // Check if itinerary match date range and dispatch notification
            });
          });
          res.json({status: order.status});
        });
      });
    });
  });
};
