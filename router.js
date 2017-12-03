const User = require('./controllers/user');
const Auth = require('./controllers/auth');
const UserModels = require('./models/user');
const Order = require('./controllers/order');
const Scraper = require('./controllers/scraper');
const passportService = require('./services/passport');
const passport = require('passport');

const UserType = UserModels.userType;

const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });

module.exports = function (app) {
    app.get('/', requireAuth, function(req, res) {
        res.send({ message: 'Super secret code is ABC123'});
    });

    app.get('/shoppingcart', requireAuth, Order.cart);
    app.get('/user', requireAuth, User.getUser);
    app.get('/orders', requireAuth, Order.getOrders);
    app.get('/orders/buyer/id', requireAuth, Order.getOrdersByBuyerId);
    app.post('/shoppingcart', requireAuth, Order.addItem);
    app.post('/shoppingcart/check', requireAuth, Order.checkItem);
    app.post('/shoppingcartitem', requireAuth, Order.getItem);
    app.post('/checkout', requireAuth, Order.checkout);
    app.post('/search', requireAuth, Scraper.scrape);
    app.post('/signin', requireSignin, Auth.signin);
    app.post('/signup', Auth.signup);
    app.post('/shipping/add', requireAuth, User.addShipping);
    app.post('/shipping', requireAuth, User.getShippingAddress);
    app.post('/itinerary/add', requireAuth, User.addItinerary);
    app.post('/itinerary', requireAuth, User.getTravelItinerary);
    app.post('/itinerary/upload', User.uploadItinerary);
    app.post('/orders/one', requireAuth, Order.getOneOrder);
    app.post('/orders/find/traveler', requireAuth, Order.findTravelers);
    app.post('/orders/one/invoice', requireAuth, Order.getInvoice);
    app.post('/orders/send/invoice', requireAuth, Order.sendInvoice);
    app.post('/orders/one/package', requireAuth, Order.getPackage);
    app.post('/user/notifications', requireAuth, Order.getNotifications);
    app.post('/user/notifications/accept', requireAuth, Order.acceptPackage);
    app.post('/save-stripe-token', requireAuth, Order.saveToken);
    app.put('/user', requireAuth, User.updateUser);
    app.put('/user/primaryShippingAddress', requireAuth, User.changePrimaryShipping);
    app.put('/user/traveler', requireAuth, User.updateTravelerStatus);
    app.put('/orders/item', requireAuth, Order.updateItem);
    app.put('/orders/package/delivered', requireAuth, Order.packageDelivered);
    app.put('/orders/package/delivered/knutsford', requireAuth, Order.deliveredToKnutsford);
    app.delete('/orders/delete/one', requireAuth, Order.deleteOrder);
    app.delete('/shoppingcartitem', requireAuth, Order.removeItem);
    app.delete('/itinerary', requireAuth, User.removeTravelItinerary);
    app.delete('/shipping', requireAuth, User.removeShippingAddress);
    app.delete('/notifications', requireAuth, User.deleteNotification);
    app.delete('/notifications/all', requireAuth, User.deleteAllNotifications);
    app.delete('/notifications/one/invoice', requireAuth, Order.dismissInvoice);
}
