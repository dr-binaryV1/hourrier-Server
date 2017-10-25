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

    app.get('/shoppingcart', Order.cart);
    app.post('/shoppingcart', Order.addItem);
    app.post('/shoppingcart/check', Order.checkItem);
    app.post('/shoppingcartitem', Order.getItem);
    app.delete('/shoppingcartitem', Order.removeItem);
    app.post('/checkout', Order.checkout);
    app.post('/search', Scraper.scrape);
    app.post('/signin', requireSignin, Auth.signin);
    app.post('/signup', Auth.signup);

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
