let passport = require('passport');
var User = require('../model/User');
const { client_id, client_secret, callback_url } = require('../keys');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser(function (user, done) {
	done(null, user._id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(null, user);
	});
});
passport.use(
	new GoogleStrategy(
		{
			clientID: client_id,
			clientSecret: client_secret,
			callbackURL: callback_url,
		},
		function (accessToken, refreshToken, profile, cb) {
			console.log(profile);
			const newuser = new User({
				name: profile.displayName,
				googleid: profile.id,
			});
			console.log(newuser);
			User.findOne({ googleid: profile.id }, (err, user) => {
				if (err) {
					console.log(err);
				} else {
					if (user) {
						cb(null, user);
					} else {
						newuser.save((err, data) => {
							if (err) {
								console.log('newin');
								console.log(err);
							} else {
								console.log('ink');

								console.log(data);
								cb(null, data);
							}
						});
					}
				}
			});
		}
	)
);
module.exports = passport;
