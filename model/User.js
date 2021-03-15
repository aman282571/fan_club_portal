var mongoose = require('mongoose');
var user = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	googleid: {
		type: String,
	},
	password: {
		type: String,
	},

	admin: {
		type: Boolean,
	},
	countmsgs: {
		type: Number,
		default: 0,
	},
	img: String,
	email: {
		type: String,
	},
	hobbies: [
		{
			data: String,
		},
	],
	rooms: [{ _id: false, roomid: String, name: String }],
	date: {
		type: Date,
		default: Date.now,
	},
});
var User = mongoose.model('Users', user);
module.exports = User;
