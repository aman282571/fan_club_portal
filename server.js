var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
let ejs = require('ejs');
var http = require('http');
var User = require('./model/User');
var rooms = require('./model/rooms');
let formatmsg = require('./js/moment');
let userdata = require('./js/userdata');

var app = express();
//session

app.use(
	session({
		secret: 'dummy secret',
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: false,
			maxAge: 1000 * 60 * 60,
		},
	})
);

//static files
app.use('/cssfiles', express.static(__dirname + '/cssfiles'));
app.use('/js', express.static(__dirname + '/js'));
// middlewares-----
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', require('./router'));

app.set('view engine', 'ejs');

var server = http.createServer(app);
var io = require('socket.io')(server);

io.on('connection', (socket) => {
	socket.on('joinroom', ({ roomid, adminid }) => {
		User.findById(adminid, (err, user) => {
			if (err) {
				socket.emit('roomdata', 'not found');
				console.log('user not found' + err);
			} else {
				userdata.newuser({
					roomid,
					adminid,
					socketid: socket.id,
					sendername: user.name,
				});
				user = userdata.finduser(adminid);
				socket.join(roomid);
				rooms.findById(roomid, (err, room) => {
					if (err) console.log(err);
					else {
						io.to(roomid).emit('roomdata', room);
						rooms.findOne(
							{ _id: roomid, 'msgs.senderid': adminid },
							(err, result) => {
								if (err) {
									console.log('not found' + err);
								} else if (!result) {
									rooms.findByIdAndUpdate(
										roomid,
										{
											$push: {
												msgs: {
													status: 'joined',
													senderid: adminid,
													sendername: user.sendername,
													msgtime: '',
													text: '',
													msgtype: '',
												},
											},
										},
										{ new: true },
										(err, room) => {
											if (err) console.log(err);
											else {
												formatedmsg = formatmsg(`Welcome ${user.sendername}`);
												socket.emit('msg', {
													formatedmsg,
													sendername: 'Server',
													senderid: '',
													msgtype: 'text',
												});
											}
										}
									);
								} else {
									socket.emit('oldmsgs', result.msgs);
								}
							}
						);
					}
				});
			}
		});
	});
	//------------room data changed---------------
	socket.on('roomdatachanged', ({ roomid, adminid }) => {
		rooms.findById(roomid, (err, room) => {
			if (err) console.log(err);
			else {
				io.to(roomid).emit('roomdata', room);
			}
		});
	});

	//getting msg from users-------------------------------------------
	socket.on('usermsg', ({ adminid, roomid, msg, type }) => {
		if (type == 'image') msgtype = 'image';
		else msgtype = 'text';
		formatedmsg = formatmsg(msg);
		user = userdata.finduser(adminid);
		//--storing msg on database--------------------
		rooms.findByIdAndUpdate(
			roomid,
			{
				$push: {
					msgs: {
						status: 'Active',
						senderid: adminid,
						sendername: user.sendername,
						msgtime: formatedmsg.time,
						text: msg,
						msgtype: msgtype,
					},
				},
			},
			{ new: true },
			(err, room) => {
				if (err) console.log(err);
			}
		);
		io.to(roomid).emit('msg', {
			formatedmsg,
			sendername: user.sendername,
			senderid: adminid,
			msgtype,
		});
	});
	//on disconnect

	socket.on('disconnect', () => {
		user = userdata.deleteuser(socket.id);
		if (user) {
			rooms.findByIdAndUpdate(
				user.roomid,
				{
					$push: {
						msgs: {
							status: 'left',
							senderid: user.adminid,
							sendername: user.sendername,
							msgtime: '',
							text: '',
							msgtype: '',
						},
					},
				},
				{ new: true },
				(err, room) => {
					if (err) console.log(err);
				}
			);
		}
	});
});
//-------------------listening to server-----------
server.listen(3000, () => {
	console.log(' connected to server...');
});
