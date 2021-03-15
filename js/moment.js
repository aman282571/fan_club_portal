let moment = require('moment');
function formatmsg(msg) {
	return {
		msg: msg,
		time: moment().format('YYYY-MM-DD,h:mm a'),
	};
}
module.exports = formatmsg;
