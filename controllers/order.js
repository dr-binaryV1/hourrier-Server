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
    orderId: req.body.orderId,
    items: req.body.items,
    details: `This package contains ${req.body.items.length} item(s). Click view to see the details of this package.`
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

              const ONE_HOUR = 60 * 60 * 1000;
              const validItinerary = itineraries.filter(itinerary => {
                return (new Date(itinerary.departureDate)) - Date.now() > (ONE_HOUR * 72);
              });

              if(validItinerary.length > 0) {
                availableTravelerCount++;
                user.notificationIds.push(notification._id);
              }
              user.save((err, user) => {
                if(err) { return next(err); }
              });
            });
          });
          res.json({status: order.status, travelersFound: availableTravelerCount});
        });
      });
    });
  });
};

exports.getNotifications = (req, res, next) => {
  OrderNotification.find({"_id": req.body.notificationsId.map(id => { return id })}, null, (err, notifs) => {
    if(err) { return next(err); }

    const activeNotifications = notifs.filter(notification => {
      return notification.status === 'active'
    });

    res.json({notifications: activeNotifications});
  });
};

exports.acceptPackage = (req, res, next) => {
  OrderNotification.findOne({"_id": req.body.notificationId}, null, (err, notification) => {
    if(err) { return next(err); }

    notification.status = 'inactive';
    notification.save((err, notif) => {
      if(err) { return next(err); }

      Order.findOne({"_id": notif.orderId}, null, (err, order) => {
        if(err) { return next(err); }

        order.status = 'traveler found';
        order.travelerId = req.get('userId');
        order.save((err, order) => {
          if(err) { return next(err); }

          User.findOne({"_id": req.get('userId')}, null, (err, user) => {
            if(err) { return next(err); }

            user.notificationIds = user.notificationIds.filter(id => {
              return id !== req.body.notificationId
            });

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
                itineraryIds: user.itineraryIds,
                notificationIds: user.notificationIds,
                primaryShippingAddress: user.primaryShippingAddress,
                shippingAddressIds: user.shippingAddressIds,
                traveler: user.traveler,
                email: user.email
              };

              res.json({user: data});
            });
          });
        });
      });
    });
  });
};
