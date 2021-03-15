var mongoose = require('mongoose');

var Room = new mongoose.Schema({
	roomname: {
		type: String,
		required: true,
	},
	desc: {
		type: String,
		required: true,
	},
	msgs: [
		{
			_id: false,
			status: String,
			senderid: String,
			sendername: String,
			text: String,
			msgtime: String,
			msgtype: String,
		},
	],
	users: [
		{
			_id: false,
			id: String,
			name: String,
			admin: Boolean,
		},
	],

	date: {
		type: Date,
		default: Date.now,
	},
	img: String,
});
var Room = mongoose.model('Rooms', Room);
module.exports = Room;
