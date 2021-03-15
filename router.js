var express = require('express');
var passport = require('./google-auth/googlestrategy');
var User = require('./model/User');
var rooms = require('./model/rooms');
let bcrypt = require('bcrypt');
var multer = require('multer');
var path = require('path');
const { mongo_uri } = require('./keys');

router = express.Router();
//storing file on server
var storage = multer.diskStorage({
	destination: './upload',
	filename: function (req, file, cb) {
		cb(
			null,
			file.fieldname + '-' + Date.now() + path.extname(file.originalname)
		);
	},
});

var upload = multer({ storage: storage });
router.use(passport.initialize());
router.use(passport.session());
router.use('/upload', express.static(__dirname + '/upload'));
//connection to mongoose
const mongoose = require('mongoose');

mongoose
	.connect(mongo_uri, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log(' mongoose connected ');
	})
	.catch((err) => {
		console.log(err);
	});

//static files
router.use(
	'/auth/google/redirect/cssfiles',
	express.static(__dirname + '/cssfiles')
);
router.use('/cssfiles', express.static(__dirname + '/cssfiles'));
router.use('/js', express.static(__dirname + '/js'));

//--------------middleware for redirecting to login page if not loged in-----------
function redirectusers() {
	return (req, res, next) => {
		if (!(req.session.userid || req.session.passport)) res.redirect('/login');
		else next();
	};
}

//login signin getrequest
router.get('/', (req, res) => {
	if (req.session.userid || req.session.passport)
		res.redirect(
			`/profile?userid=${req.session.userid || req.session.passport.user}`
		);
	else res.render('index');
});
router.get('/login', (req, res) => {
	if (req.session.userid || req.session.passport)
		res.redirect(
			`/profile?userid=${req.session.userid || req.session.passport.user}`
		);
	else res.render('login');
});
router.get('/profile', redirectusers(), (req, res) => {
	User.findById(req.query.userid, (err, user) => {
		if (err) {
			console.log(err);
			res.send('not found');
		} else if (!user) {
			res.send('not found');
		} else {
			if ((req.session.userid || req.session.passport.user) == req.query.userid)
				res.render('profile', { admin: true });
			else res.render('profile', { admin: false });
		}
	});
});
router.get('/getuserdata/:id', redirectusers(), (req, res) => {
	User.findById(req.params.id, (err, user) => {
		if (err) {
			console.log(err);
			res.send('not found');
		} else if (!user) {
			res.send('not found');
		} else {
			res.json(user);
		}
	});
});
router.get('/createroom', redirectusers(), (req, res) => {
	res.render('createroom');
});
router.get('/followothers', redirectusers(), (req, res) => {
	res.render('allrooms');
});
router.get('/clubs', redirectusers(), (req, res) => {
	rooms.find((err, rooms) => {
		if (err) console.log(err);
		else {
			res.json({
				rooms: rooms,
				userid: req.session.userid || req.session.passport.user,
			});
		}
	});
});
router.get('/leaderboard', redirectusers(), (req, res) => {
	res.render('leaderboard');
});
router.get('/users', redirectusers(), (req, res) => {
	User.find((err, users) => {
		if (err) console.log(err);
		else {
			res.json(users);
		}
	});
});

router.put('/countmsgs', redirectusers(), (req, res) => {
	User.findById(req.query.userid, (err, user) => {
		if (err) console.log('error in increasing countmsgs' + err);
		else {
			user.countmsgs += 1;

			user.save((err, user) => {
				if (err) console.log('not saved  after updating' + err);
				else {
					res.json('success');
				}
			});
		}
	});
});

//----------changing description of room-----------------
router.put('/changedesc', redirectusers(), (req, res) => {
	rooms.findByIdAndUpdate(
		req.query.roomid,
		{ $set: { desc: req.query.roomdesc } },
		(err, rooms) => {
			if (err) console.log(err);
			else {
				res.json('success');
			}
		}
	);
});

router.put('/changename', redirectusers(), (req, res) => {
	rooms.findByIdAndUpdate(
		req.query.roomid,
		{ $set: { roomname: req.query.roomname } },
		(err, rooms) => {
			if (err) console.log(err);
			else {
				User.updateMany(
					{ 'rooms.roomid': req.query.roomid },
					{ $set: { 'rooms.$.name': req.query.roomname } },

					(err, result) => {
						if (err) console.log(err);
						else res.json('success');
					}
				);
			}
		}
	);
});
router.put('/removefromadmin', redirectusers(), (req, res) => {
	rooms.findById(req.query.roomid, (err, room) => {
		room.users.forEach((user) => {
			if (user.id == req.query.adminid) {
				if (user.admin) {
					rooms.updateOne(
						{ _id: req.query.roomid, 'users.id': req.query.userid },
						{ $set: { 'users.$.admin': false } },
						(err, room) => {
							if (err) console.log('removefromadmin error' + err);
							else res.json('success');
						}
					);
				} else {
					res.json('failed');
				}
			}
		});
	});
});
router.put('/makeadmin', redirectusers(), (req, res) => {
	rooms.findById(req.query.roomid, (err, room) => {
		room.users.forEach((user) => {
			if (user.id == req.query.adminid) {
				if (user.admin) {
					rooms.updateOne(
						{
							_id: req.query.roomid,
							'users.id': req.query.userid,
						},
						{ $set: { 'users.$.admin': true } },
						(err, room) => {
							if (err) console.log('removefromadmin error' + err);
							else res.json('success');
						}
					);
				} else res.json('fail');
			}
		});
	});
});
router.get('/followclub', redirectusers(), (req, res) => {
	User.findById(req.query.userid, (err, user) => {
		if (err) console.log(err);
		else {
			rooms.findByIdAndUpdate(
				req.query.roomid,
				{
					$push: {
						users: { id: req.query.userid, name: user.name, admin: false },
					},
				},

				(err, result) => {
					if (err) console.log(err);
					else {
						User.findByIdAndUpdate(
							req.query.userid,
							{
								$push: {
									rooms: { roomid: req.query.roomid, name: result.roomname },
								},
							},

							(err, user) => {
								if (err) console.log(err);
								else res.json('success');
							}
						);
					}
				}
			);
		}
	});
});

router.get('/unfollowclub', redirectusers(), (req, res) => {
	User.findById(req.query.userid, (err, user) => {
		if (err) console.log(err);
		else {
			rooms.findByIdAndUpdate(
				req.query.roomid,
				{
					$pull: {
						users: { id: req.query.userid },
					},
				},

				(err, result) => {
					if (err) console.log(err);
					else {
						User.findByIdAndUpdate(
							req.query.userid,
							{
								$pull: {
									rooms: { roomid: req.query.roomid },
								},
							},

							(err, user) => {
								if (err) console.log(err);
								else res.json('success');
							}
						);
					}
				}
			);
		}
	});
});

router.post('/roomcreated', redirectusers(), (req, res) => {
	rooms.findOne({ roomname: req.body.roomname }, (err, room) => {
		if (err) console.log(err);
		else if (room) {
			const error = 'Use another Roomname,its already created !!';
			res.render('createroom', { error: error });
		} else {
			User.findById(
				req.session.userid || req.session.passport.user,
				(err, user) => {
					if (err) console.log(err);
					else {
						let newroom = {
							roomname: req.body.roomname,
							desc: req.body.desc,
							users: [
								{
									id: req.session.userid || req.session.passport.user,
									name: user.name,
									admin: true,
								},
							],
						};
						new rooms(newroom).save((err, room) => {
							if (err) console.log('room not created' + err);
							else {
								User.findByIdAndUpdate(
									req.session.userid || req.session.passport.user,
									{
										$push: {
											rooms: { roomid: room._id, name: room.roomname },
										},
									},
									{
										new: true,
									},

									(err, user) => {
										if (err) console.log(err);
										else {
											return res.redirect(
												`/showchatroom?roomid=${room._id}&adminid=${user._id}`
											);
										}
									}
								);
							}
						});
					}
				}
			);
		}
	});
});

router.get('/showchatroom', redirectusers(), (req, res) => {
	rooms.findById(req.query.roomid, (err, room) => {
		if (err) res.status(404).send('not found');
		else if (!room) res.send('not found');
		else {
			if (
				req.query.adminid == (req.session.userid || req.session.passport.user)
			) {
				User.findById(req.query.adminid, (err, user) => {
					if (err) res.status(404).send('not found');
					else if (!room) res.status(404).send('not found');
					else {
						res.render('chat');
					}
				});
			} else {
				User.findById(req.query.adminid, (err, user) => {
					if (err) res.status(404).send('not found');
					else if (!room) res.status(404).send('not found');
					else {
						res.render('chat');
					}
				});
			}
		}
	});
});
router.get('/chat', redirectusers(), (req, res) => {
	if (req.query.userid && req.query.adminid) res.render('chat');
	else {
		res.send('not found');
	}
});

router.put('/addhobby', redirectusers(), (req, res) => {
	User.updateOne(
		{ _id: req.query.userid },
		{ $push: { hobbies: { data: req.query.data } } },
		{ new: true },
		(err, result) => {
			if (err) console.log(err);
			else {
				User.findById(req.query.userid, (err, user) => {
					if (err) console.log(err);
					else {
						res.json(user);
					}
				});
			}
		}
	);
});
router.delete('/deletehobby', redirectusers(), (req, res) => {
	User.updateOne(
		{ _id: req.query.userid },
		{ $pull: { hobbies: { _id: req.query.hobby_id } } },
		{ new: true },
		(err, result) => {
			if (err) console.log(err);
			else {
				res.json('success');
			}
		}
	);
});

// ---------------oauth------------------
router.get(
	'/auth/google',
	passport.authenticate('google', { scope: ['profile'] })
);

router.get(
	'/auth/google/redirect',
	passport.authenticate('google', { failureRedirect: '/login' }),
	(req, res) => {
		res.redirect(`/profile?userid=${req.session.passport.user}`);
	}
);
router.get('/logout', redirectusers(), (req, res) => {
	req.session.destroy((err) => {
		if (err) console.log(err);
		else {
			console.log('session destroyed successfully');
			res.redirect('/login');
		}
	});
});
//postrequests
router.post('/register', (req, res) => {
	const { name, email, password } = req.body;
	User.findOne({ name: name }, (err, user) => {
		if (user) {
			bcrypt.compare(password, user.password, (err, result) => {
				if (result == true) {
					const error = 'Already Registered,  Login please !!';
					res.render('index', { error: error });
				} else {
					const error = 'Use another username !!';
					res.render('index', { error: error });
				}
			});
		} else if (password.length < 8) {
			const error = 'Password should contain atleast 8 character';
			res.render('index', { error: error });
		} else {
			const newuser = new User({
				name: name,
				email: email,
				password: password,
			});
			bcrypt.hash(password, 10, (err, hashed) => {
				if (err) console.log('not hashed' + err);
				else {
					newuser.password = hashed;
					newuser.save((err, data) => {
						if (err) console.log(err);
					});
					res.render('login');
				}
			});
		}
	});
});
router.post('/login', (req, res) => {
	const { name, password } = req.body;

	User.findOne({ name: name }, (err, user) => {
		if (user != null) {
			bcrypt.compare(password, user.password, (err, result) => {
				if (err) {
					console.log(err);
				} else if (result == true) {
					req.session.userid = user._id;

					res.redirect(`/profile?userid=${user._id}`);
				} else {
					const msg = 'Wrong Password !!';
					res.render('login', { msg: msg });
				}
			});
		} else {
			const msg = 'Please Sign Up First!!';
			res.render('login', { msg: msg });
		}
	});
});
router.post('/changephoto', upload.single('profilepic'), (req, res) => {
	User.findByIdAndUpdate(
		req.query.userid,
		{ $set: { img: req.file.filename } },
		{ new: true },
		(err, result) => {
			if (err) console.log(' profilephoto not uploaded' + err);
			else {
				res.json(result);
			}
		}
	);
});
router.post('/changeroomphoto', upload.single('roomprofilepic'), (req, res) => {
	rooms.findByIdAndUpdate(
		req.query.roomid,
		{ $set: { img: req.file.filename } },
		{ new: true },
		(err, room) => {
			if (err) console.log('room photo not uploaded' + err);
			else {
				res.json('success');
			}
		}
	);
});
router.post(
	'/uploadphotoingrp',
	redirectusers(),
	upload.single('uploadphotoingrp'),
	(req, res) => {
		res.json(req.file.filename);
	}
);

module.exports = router;
