const config = require('../config');
const stripe = require('stripe')(config.stripeKey);
const mail = require('../services/mailer');
const OrderModels = require('../models/order');
const UserModels = require('../models/user');
const moment = require('moment');
const User = UserModels.user;
const Itinerary = UserModels.travelItinerary;
const Shipping = UserModels.shipping;
const Cart = OrderModels.cart;
const Item = OrderModels.item;
const Product = OrderModels.item;
const OrderItems = OrderModels.orderItems;
const Notification = OrderModels.notification;
const Order = OrderModels.order;
const Invoice = OrderModels.invoice;
const Package = OrderModels.package;
const KnutsfordItem = OrderModels.knutsfordItems;

exports.cart = (req, res, next) => {
  Cart.findOne({ "userId": req.get('user') }, null, (err, cart) => {
    if (err) { return next(err); }
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

    Cart.findOne({ "userId": req.get('user') }, null, (err, cart) => {
      if (err) { return next(err); }

      cart.itemIds.push(item._id);
      cart.save((err, cart) => {
        if (err) { return next(err); }
        res.json(cart);
      });
    });
  });
};

exports.getItem = (req, res, next) => {
  Item.find({ "_id": req.body.itemIds.map(id => { return id }) }, null, (err, items) => {
    if (err) { return next(err); }
    res.json({ items: items });
  });
};

exports.checkItem = (req, res, next) => {
  Cart.findOne({ "userId": req.get('user') }, null, (err, cartItems) => {
    if (err) { return next(err); }

    Item.find({ "_id": cartItems.itemIds.map(id => { return id }) }, null, (err, items) => {
      if (err) { return next(err); }
      let filteredItems = items.filter(item => {
        return item.name === req.body.itemName
      });

      filteredItems.length > 0 ? res.json({ itemFound: true }) : res.json({ itemFound: false });
    });
  });
};

exports.updateItem = (req, res, next) => {
  Item.findOne({ "_id": req.body.newItem._id }, null, (err, item) => {
    if (err) { return next(err); }

    item.price = req.body.newItem.price;
    item.save((err, item) => {
      if (err) { return next(err); }

      Order.find({}, null, (err, orders) => {
        if (err) { return next(err); }
        res.json({ orders });
      });
    });
  });
};

exports.removeItem = (req, res, next) => {
  Cart.findOne({ "userId": req.get('user') }, null, (err, cart) => {
    if (err) { return next(err); }

    cart.itemIds = cart.itemIds.filter((id) => {
      return id !== req.body.itemId;
    });

    cart.save((err, cart) => {
      if (err) { return next(err); }

      Item.remove({ "_id": req.body.itemId }, (err) => {
        if (err) { return next(err); }
        Item.find({}, null, (err, items) => {
          if (err) { return next(err); }
          res.json(items);
        });
      });
    });
  });
};

exports.checkout = (req, res, next) => {
  const orderItems = new OrderItems({
    itemIds: req.body.order.itemIds
  });

  orderItems.save((err, items) => {
    if (err) { return next(err); }

    const order = new Order({
      buyerId: req.get('user'),
      orderItemsId: items._id,
      deliveryLocation: req.body.order.location,
      createdAt: Date.now()
    });

    order.save((err, order) => {
      if (err) { return next(err); }
      Cart.findOne({ "userId": req.get('user') }, null, (err, cart) => {
        cart.itemIds = [];
        cart.save((err, cart) => {
          if (err) { return next(err); }

          Item.find({ "_id": items.itemIds }, null, (err, _items) => {
            if (err) { return next(err); }

            const notif = new Notification({
              subject: 'You have a package request',
              orderId: order._id,
              items: _items,
              details: `This package contains ${items.itemIds.length} item(s). Click view to see the details of this package.`,
              createdAt: Date.now()
            });

            notif.save((err, notification) => {
              if (err) { return next(err); }

              Order.findOne({ "_id": order._id }, null, (err, order) => {
                if (err) { return next(err); }

                order.status = 'locating travelers';
                order.save((err, order) => {
                  if (err) { return next(err); }

                  User.find({ "traveler": true }, null, (err, users) => {
                    if (err) { return next(err); }

                    let availableTravelerCount = 0;
                    users.map(user => {
                      Itinerary.find({ "_id": user.itineraryIds.map(id => { return id }) }, null, (err, itineraries) => {
                        if (err) { return next(err); }

                        const ONE_DAY = 60 * 60 * 1000 * 24;
                        const validItinerary = itineraries.filter(itinerary => {
                          const departureDate = new Date(itinerary.departureDate);
                          return (
                            departureDate - Date.now() >= (ONE_DAY * 3) &&
                            departureDate - Date.now() <= (ONE_DAY * 7) &&
                            order.buyerId != user._id &&
                            user.shippingAddressIds.length > 0 &&
                            user.primaryShippingAddress !== ''
                          );
                        });

                        if (validItinerary.length > 0) {
                          availableTravelerCount++;
                          user.notificationIds.push(notification._id);

                          const body = {
                            from: '"Hourrier Team" <info.hourrier@gmail.com>', // sender address
                            to: user.email, // list of receivers
                            subject: 'You have a new travel request!', // Subject line
                            text: `Hello, ${user.username} \nYou have package request. Please visit the following link to view package. \n\nhttp://localhost:3000/notifications \n\nThank You, \nHourrier Team` // Email Body
                          };

                          mail(body);
                        }
                        user.save((err, user) => {
                          if (err) { return next(err); }
                        });
                      });
                    });
                    res.json({ itemIds: cart.itemIds });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

exports.getOrders = (req, res, next) => {
  Order.find({}, null, (err, orders) => {
    if (err) { return next(err); }
    res.json({ orders });
  });
};

exports.getOneOrder = (req, res, next) => {
  Order.findOne({ "_id": req.body.orderId }, null, (err, order) => {
    if (err) { return next(err); }

    OrderItems.findOne({ "_id": order.orderItemsId }, null, (err, orderItems) => {
      if (err) { return next(err); }

      Item.find({ "_id": orderItems.itemIds.map(id => { return id }) }, null, (err, items) => {
        if (err) { return next(err); }

        User.findOne({ "_id": order.buyerId }, null, (err, user) => {
          if (err) { return next(err); }

          var buyer = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            mailingAddress1: user.mailingAddress1,
            mailingAddress2: user.mailingAddress2,
            mailingCity: user.mailingCity,
            mailingCountry: user.mailingCountry,
            mailingZip: user.mailingZip,
            email: user.email
          };

          if (order.travelerId !== null) {
            User.findOne({ "_id": order.travelerId }, null, (err, user) => {
              if (err) { return next(err); }

              const traveler = {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email
              };

              Itinerary.find({ "_id": user.itineraryIds.map(itinerary => { return itinerary }) }, null, (err, itinerary) => {
                if (err) { return next(err); }

                Shipping.findOne({ "_id": user.primaryShippingAddress }, null, (err, shipping) => {
                  if (err) { return next(err); }

                  res.json({ items, buyer, traveler, status: order.status, updatedAt: order.updatedAt, itinerary, shipping });
                });
              });
            });
          } else {
            res.json({ items, buyer, status: order.status, updatedAt: order.updatedAt });
          };
        });
      });
    });
  });
};

exports.getOrdersByBuyerId = (req, res, next) => {
  Order.find({ "buyerId": req.get('user') }, null, (err, orders) => {
    if (err) { return next(err); }

    res.json(orders);
  });
};

exports.deleteOrder = (req, res, next) => {
  Order.remove({ "_id": req.body.orderId }, (err) => {
    if (err) { return next(err); }

    Order.find({}, null, (err, orders) => {
      if (err) { return next(err); }
      res.json({ orders });
    });
  });
};

exports.findTravelers = (req, res, next) => {
  const notif = new Notification({
    subject: 'You have a package request',
    orderId: req.body.orderId,
    items: req.body.items,
    details: `This package contains ${req.body.items.length} item(s). Click view to see the details of this package.`,
    createdAt: Date.now()
  });

  notif.save((err, notification) => {
    if (err) { return next(err); }

    Order.findOne({ "_id": req.body.orderId }, null, (err, order) => {
      if (err) { return next(err); }

      order.status = 'locating travelers';
      order.updatedAt = Date.now();
      order.save((err, order) => {
        if (err) { return next(err); }

        User.find({ "traveler": true }, null, (err, users) => {
          if (err) { return next(err); }

          let availableTravelerCount = 0;
          users.map(user => {
            Itinerary.find({ "_id": user.itineraryIds.map(id => { return id }) }, null, (err, itineraries) => {
              if (err) { return next(err); }

              const ONE_DAY = 60 * 60 * 1000 * 24;
              const validItinerary = itineraries.filter(itinerary => {
                const departureDate = new Date(itinerary.departureDate);
                return (
                  departureDate - Date.now() >= (ONE_DAY * 3) &&
                  departureDate - Date.now() <= (ONE_DAY * 7) &&
                  order.buyerId !== user._id &&
                  user.shippingAddressIds.length > 0 &&
                  user.primaryShippingAddress !== ''
                );
              });

              if (validItinerary.length > 0) {
                availableTravelerCount++;
                user.notificationIds.push(notification._id);

                const body = {
                  from: '"Hourrier Team" <info.hourrier@gmail.com>', // sender address
                  to: user.email, // list of receivers
                  subject: 'You have a new travel request!', // Subject line
                  text: `Hello, ${user.username} \nYou have package request. Please visit the following link to view package. \n\nhttp://localhost:3000/notifications \n\nThank You, \nHourrier Team` // Email Body
                };

                mail(body);
              }
              user.save((err, user) => {
                if (err) { return next(err); }
              });
            });
          });
          res.json({ status: order.status, travelersFound: availableTravelerCount });
        });
      });
    });
  });
};

exports.getNotifications = (req, res, next) => {
  Notification.find({ "_id": req.body.notificationsId.map(id => { return id }) }, null, (err, notifs) => {
    if (err) { return next(err); }

    const activeNotifications = notifs.filter(notification => {
      return notification.status === 'active'
    });

    res.json({ notifications: activeNotifications });
  });
};

exports.acceptPackage = (req, res, next) => {
  Notification.findOne({ "_id": req.body.notificationId }, null, (err, notification) => {
    if (err) { return next(err); }

    notification.status = 'inactive';
    notification.save((err, notif) => {
      if (err) { return next(err); }

      Order.findOne({ "_id": notif.orderId }, null, (err, order) => {
        if (err) { return next(err); }

        order.status = 'traveler found';
        order.travelerId = req.get('userId');
        order.updatedAt = Date.now();
        order.save((err, order) => {
          if (err) { return next(err); }

          User.findOne({ "_id": req.get('userId') }, null, (err, user) => {
            if (err) { return next(err); }

            user.notificationIds = user.notificationIds.filter(id => {
              return id !== req.body.notificationId
            });

            const pkg = new Package({
              orderId: order._id,
              travelerId: user._id,
              items: notif.items,
              createdAt: Date.now()
            });

            pkg.save((err, pkg) => {
              if (err) { return next(err); }

              user.packageIds.push(pkg._id);
              user.save((err, user) => {
                if (err) { return next(err); }

                const data = {
                  firstname: user.firstname,
                  lastname: user.lastname,
                  username: user.username,
                  mailingAddress1: user.mailingAddress1,
                  mailingAddress2: user.mailingAddress2,
                  mailingCity: user.mailingCity,
                  mailingCountry: user.mailingCountry,
                  mailingZip: user.mailingZip,
                  role: user.role,
                  userTypeId: user.userTypeId,
                  itineraryIds: user.itineraryIds,
                  notificationIds: user.notificationIds,
                  packageIds: user.packageIds,
                  primaryShippingAddress: user.primaryShippingAddress,
                  shippingAddressIds: user.shippingAddressIds,
                  traveler: user.traveler,
                  email: user.email
                };
                order.packageId = pkg._id;
                order.save((err, order) => {
                  if (err) { return next(err); }

                  res.json({ user: data });
                });
              });
            });
          });
        });
      });
    });
  });
};

exports.sendInvoice = (req, res, next) => {
  const invoice = new Invoice({
    buyerId: req.body.invoice.buyerId,
    orderId: req.body.invoice.orderId,
    items: req.body.invoice.items,
    fee: req.body.invoice.fee,
    total: req.body.invoice.total,
    createdAt: Date.now()
  });

  invoice.save((err, invoice) => {
    if (err) { return next(err); }

    const notif = new Notification({
      invoiceId: invoice._id,
      type: 'invoice',
      subject: 'Your invoice is ready',
      details: `Click view to see the details of this invoice.`,
      createdAt: Date.now()
    });

    notif.save((err, notification) => {
      if (err) { return next(err); }

      User.findOne({ "_id": req.body.invoice.buyerId }, null, (err, user) => {
        if (err) { return next(err); }

        user.notificationIds.push(notification._id);
        user.save((err, user) => {
          if (err) { return next(err); }

          Order.findOne({ "_id": req.body.invoice.orderId }, null, (err, order) => {
            if (err) { return next(err); }

            order.status = 'invoice sent';
            order.updatedAt = Date.now();
            order.save((err, order) => {
              if (err) { return next(err); }

              const body = {
                from: '"Hourrier Team" <info.hourrier@gmail.com>', // sender address
                to: user.email, // list of receivers
                subject: 'Your Invoice is ready!', // Subject line
                text: `Hello, ${user.username} \nYou have an invoice to attend to. Please visit the following link to view invoice. \n\nhttp://localhost:3000/notifications \n\nThank You, \nHourrier Team` // Email Body
              };

              mail(body);

              res.json({ status: order.status });
            });
          });
        });
      });
    });
  });
};

exports.dismissInvoice = (req, res, next) => {
  User.findOne({ "_id": req.get('userId') }, null, (err, user) => {
    if (err) { return next(err); }

    Notification.findOne({ "invoiceId": req.body.invoiceId }, null, (err, notif) => {
      if (err) { return next(err); }

      user.notificationIds = user.notificationIds.filter(id => { return id != notif._id });
      user.save((err, user) => {
        if (err) { return next(err); }

        const data = {
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          mailingAddress1: user.mailingAddress1,
          mailingAddress2: user.mailingAddress2,
          mailingCity: user.mailingCity,
          mailingCountry: user.mailingCountry,
          mailingZip: user.mailingZip,
          role: user.role,
          userTypeId: user.userTypeId,
          itineraryIds: user.itineraryIds,
          notificationIds: user.notificationIds,
          packageIds: user.packageIds,
          primaryShippingAddress: user.primaryShippingAddress,
          shippingAddressIds: user.shippingAddressIds,
          traveler: user.traveler,
          email: user.email
        };

        res.json({ user: data });
      });
    });
  });
};

exports.getInvoice = (req, res, next) => {
  Invoice.findOne({ "_id": req.body.invoiceId }, null, (err, invoice) => {
    if (err) { return next(err); }

    res.json(invoice);
  });
};

exports.getPackage = (req, res, next) => {
  Package.findOne({ "_id": req.body.packageId }, null, (err, pkg) => {
    if (err) { return next(err); }

    res.json(pkg);
  });
};

exports.packageDelivered = (req, res, next) => {
  Package.findOne({ "_id": req.body.packageId }, null, (err, pkg) => {
    if (err) { return next(err); }

    pkg.status = 'Package Received';
    pkg.save((err, pkg) => {
      if (err) { return next(err); }

      Order.findOne({ "_id": pkg.orderId }, null, (err, order) => {
        if (err) { return next(err); }

        order.status = 'Package Delivered';
        order.updatedAt = Date.now();
        order.save((err, order) => {
          if (err) { return next(err); }

          // Send Mail To Admin

          res.json(pkg);
        });
      });
    });
  });
};

exports.dismissPackage = (req, res, next) => {
  User.findOne({ "_id": req.get('userId') }, null, (err, user) => {
    if (err) { return next(err); }

    user.packageIds = user.packageIds.filter(id => {
      return id != req.body.packageId;
    });
    user.save((err, user) => {
      if (err) { return next(err); }

      const data = {
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        mailingAddress1: user.mailingAddress1,
        mailingAddress2: user.mailingAddress2,
        mailingCity: user.mailingCity,
        mailingCountry: user.mailingCountry,
        mailingZip: user.mailingZip,
        role: user.role,
        userTypeId: user.userTypeId,
        itineraryIds: user.itineraryIds,
        notificationIds: user.notificationIds,
        packageIds: user.packageIds,
        primaryShippingAddress: user.primaryShippingAddress,
        shippingAddressIds: user.shippingAddressIds,
        traveler: user.traveler,
        email: user.email
      };

      res.json({ user: data });
    });
  });
};

exports.deliveredToKnutsford = (req, res, next) => {
  Package.findOne({ "_id": req.body.packageId }, null, (err, pkg) => {
    if (err) { return next(err); }

    pkg.status = 'Delivered to Knutsford';
    pkg.save((err, pkg) => {
      if (err) { return next(err); }

      Order.findOne({ "_id": pkg.orderId }, null, (err, order) => {
        if (err) { return next(err); }

        order.status = 'Delivered to Knutsford - to be Confirmed';
        order.updatedAt = Date.now();
        order.save((err, order) => {
          if (err) { return next(err); }

          // Send Mail to Admin and Knutsford Admin

          res.json(pkg);
        });
      });
    });
  });
};

exports.filterOrder = (req, res, next) => {
  if (req.body.filterBy === "name") {
    if (req.body.keyword === "") {
      Order.find({}, null, (err, orders) => {
        if (err) { return next(err); }

        res.json({ orders });
      });
    } else {
      User.find({}, null, (err, users) => {
        if (err) { return next(err); }

        const matchedUser = users.filter((user) => {
          return req.body.keyword.includes(user.firstname) || req.body.keyword.includes(user.lastname);
        });

        Order.find({ "buyerId": matchedUser.map(usr => { return usr._id }) }, null, (err, orders) => {
          if (err) { return next(err); }

          res.json({ orders });
        });
      });
    };
  };

  if (req.body.filterBy === "location") {
    Itinerary.find({ "arrivalCity": req.body.keyword }, null, (err, itineraries) => {
      if (err) { return next(err); }

      if (itineraries.length > 0) {
        User.find({ "itineraryIds": itineraries.map(itinerary => { return [itinerary._id] }) }, null, (err, users) => {
          if (err) { return next(err); }

          Order.find({ "buyerId": users.map(user => { return user._id }) }, null, (err, orders) => {
            if (err) { return next(err); }

            res.json({ orders });
          });
        });
      } else {
        res.json({ orders: [] });
      }
    });
  };

  if (req.body.filterBy === "time") {
    Itinerary.find({}, null, (err, itineraries) => {
      if (err) { return next(err); }

      if (itineraries.length > 0) {
        let matchedItineraries;
        const reference = moment(Date.now());

        if (req.body.keyword === "Today") {
          matchedItineraries = itineraries.map(itinerary => {
            const arrivalTime = moment(itinerary.arrivalDate);
            const today = reference.clone().startOf('day');

            if (arrivalTime.isSame(today, 'd')) {
              return itinerary;
            };
          });
        } else if (req.body.keyword === "Tomorrow") {
          matchedItineraries = itineraries.map(itinerary => {
            const arrivalTime = moment(itinerary.arrivalDate);
            const tomorrow = reference.clone().add(1, 'days').startOf('day');

            if (arrivalTime.isSame(tomorrow, 'd')) {
              return itinerary;
            };
          });
        } else if (req.body.keyword === "3 Days") {
          matchedItineraries = itineraries.map(itinerary => {
            const arrivalTime = moment(itinerary.arrivalDate);
            const fourDays = reference.clone().add(4, 'days').startOf('day');

            if (arrivalTime.isBefore(fourDays)) {
              return itinerary;
            };
          });
        } else if (req.body.keyword === "5 Days") {
          matchedItineraries = itineraries.map(itinerary => {
            const arrivalTime = moment(itinerary.arrivalDate);
            const sixDays = reference.clone().add(6, 'days').startOf('day');

            if (arrivalTime.isBefore(sixDays)) {
              return itinerary;
            };
          });
        };

        if (matchedItineraries.length > 0) {
          User.find({
            "itineraryIds": matchedItineraries.map(itinerary => {
              if (typeof itinerary !== "undefined") return [itinerary._id]
            })
          }, null, (err, users) => {
            if (err) { return next(err); }

            Order.find({ "travelerId": users.map(user => { return user._id }) }, null, (err, orders) => {
              if (err) { return next(err); }

              res.json({ orders });
            });
          });
        } else {
          res.json({ orders: [] });
        };
      };
    });
  };
};

exports.orderPurchased = (req, res, next) => {
  Order.findOne({ "_id": req.body.orderId }, null, (err, order) => {
    if (err) { return next(err); }

    order.status = 'order purchased';
    order.updatedAt = Date.now();
    order.processedAt = Date.now();
    order.save((err, order) => {
      if (err) { return next(err); }

      const knutsfordItem = new KnutsfordItem({
        orderId: order._id,
        createdAt: Date.now()
      });

      knutsfordItem.save((err, k_item) => {
        if (err) { return next(err); }

        // Send Mail to knutsford admin
        res.json({ status: order.status });
      });
    })
  });
};

exports.saveToken = (req, res, next) => {
  stripe.charges.create({
    amount: req.body.amount,
    currency: "usd",
    source: req.body.token.id, // obtained with Stripe.js
    description: "Test Charge"
  }, function (err, charge) {
    if (err) { return next(err); }

    Invoice.findOne({ "_id": req.body.invoiceId }, null, (err, invoice) => {
      if (err) { return next(err); }

      Order.findOne({ "_id": invoice.orderId }, null, (err, order) => {
        if (err) { return next(err); }

        invoice.status = 'paid';
        order.status = 'invoice paid';
        order.updatedAt = Date.now();
        order.save((err, order) => {
          if (err) { return next(err); }
        });

        invoice.save((err, invoice) => {
          if (err) { return next(err); }
        });
      });
    });
    res.json(charge);
  });
};
