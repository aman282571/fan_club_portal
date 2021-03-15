roomuserdata = [];

function newuser({ adminid, roomid, socketid, sendername }) {
	roomuserdata.push({ adminid, roomid, socketid, sendername });
}
function deleteuser(socketid) {
	for (i = 0; i < roomuserdata.length; i++) {
		if (roomuserdata[i].socketid == socketid) {
			return roomuserdata.splice(i, 1)[0];
		}
	}
}
function finduser(adminid) {
	for (i = 0; i < roomuserdata.length; i++) {
		if (roomuserdata[i].adminid == adminid) {
			return roomuserdata[i];
		}
	}
}
module.exports = { newuser, deleteuser, finduser };
