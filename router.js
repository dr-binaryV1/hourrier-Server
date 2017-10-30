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
    app.put('/user', requireAuth, User.updateUser);
    app.put('/user/primaryShippingAddress', requireAuth, User.changePrimaryShipping);
    app.put('/user/traveler', requireAuth, User.updateTravelerStatus);
    app.delete('/shoppingcartitem', requireAuth, Order.removeItem);
    app.delete('/itinerary', requireAuth, User.removeTravelItinerary);
    app.delete('/shipping', requireAuth, User.removeShippingAddress);
    
    app.post('/usertype', (req, res, next) => {
      const name = req.body.name;

      // Check if type provided exists
      UserType.findOne({ name: name }, (err, existingType) => {
        if(err) { return next(err); }

        // If a type exist, return an error
        if(existingType) {
          return res.status(422).json({ error: "User type already exists." })
        }

        // If not exist, create a new user type
        const userType = new UserType({
          name: name
        });

        userType.save((err, result) => {
          if(err) { return next(err); }

          // Respond to the request indicating success
          res.json(result);
        });
      });
    });
}
