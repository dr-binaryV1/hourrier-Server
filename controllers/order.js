const OrderModels = require('../models/order');
const Cart = OrderModels.cart;
const Item = OrderModels.item;
const Product = OrderModels.item;
const OrderItems = OrderModels.orderItems;
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
