const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    mailingAddress1: { type: String, required: true},
    mailingAddress2: { type: String },
    mailingCity: { type: String, required: true },
    mailingCountry: { type: String, required: true },
    mailingZip: { type: String, default: "00000"},
    traveler: { type: Boolean, default: false },
    itineraryIds: [{type: String}],
    shippingAddressIds: [{type: String}],
    primaryShippingAddress: { type: String },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true }
});

const shippingSchema = new Schema({
  shippingAddress1: { type: String, required: true },
  shippingAddress2: { type: String },
  shippingCity: { type: String, required: true },
  shippingCountry: { type: String, required: true },
  shippingZip: { type: String, required: true }
});

const typeSchema = new Schema({
  name: { type: String, required: true, unique: true }
});

const travelerSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  passportPhoto: { type: String },
  shippingAddress1: { type: String, required: true },
  shippingAddress2: { type: String },
  shippingCity: { type: String, required: true },
  shippingState: { type: String, required: true },
  shippingCountry: { type: String, required: true },
  shippingZip: { type: String, required: true }
});

const travelItinerarySchema = new Schema({
    departureCity: { type: String, required: true },
    departureDate: { type: Date, required: true },
    departureTime: { type: String, required: true },
    arrivalCity: { type: String, required: true },
    arrivalDate: { type: Date, required: true },
    arrivalTime: { type: String, required: true }
});

// On Save Hook, encrypt password
userSchema.pre('save', function(next) {
    const user = this;

    bcrypt.genSalt(10, function (err, salt) {
        if(err) { return next(err); }

        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if(err) { return next(err); }

            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) { return callback(err); }

        callback(null, isMatch);
    });
}

const user_model = mongoose.model('user', userSchema);
const user_type_model = mongoose.model('userType', typeSchema);
const traveler_model = mongoose.model('traveler', travelerSchema);
const travel_itinerary_model = mongoose.model('travelItinerary', travelItinerarySchema);
const shipping_model = mongoose.model('shipping', shippingSchema);

module.exports.user = user_model;
module.exports.userType = user_type_model;
module.exports.traveler = traveler_model;
module.exports.travelItinerary = travel_itinerary_model;
module.exports.shipping = shipping_model;
