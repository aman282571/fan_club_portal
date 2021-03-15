$(document).ready(() => {
	//----------getting querystring--------
	const { roomid, adminid } = Qs.parse(location.search, {
		ignoreQueryPrefix: true,
	});
	console.log(roomid, adminid);
	$('#home').attr('href', `/profile?userid=${adminid}`);
	//setting classes to each user
	function setclasses(user) {
		return {
			user: `userclass_${user.id}`,
			removefromadmin: `removefromadmin_${user.id}`,
			makeadmin: `makeadmin_${user.id}`,
		};
	}

	let socket = io();

	function changeimage() {
		$('#roomprofilepic').change(() => {
			fetch(`/changeroomphoto?roomid=${roomid}`, {
				method: 'post',
				body: new FormData(profilepicform),
			})
				.then((response) => {
					return response.json();
				})
				.then((result) => {
					if (result == 'success') {
						console.log('profile pic changed');
						socket.emit('roomdatachanged', { roomid, adminid });
					}
				});
		});
	}
	function changeroom_name_desc(property) {
		//---------------changing  roomname,desc------------------
		$(`#save${property}`).hide();
		$(`#${property}edit`).click(() => {
			$(`#${property}`).attr('contentEditable', 'true');
			$(`#${property}`).focus();
			$(`#${property}edit`).hide();

			$(`#save${property}`).show();
			$(`#save${property}`).click(() => {
				fetch(
					`/change${property}?roomid=${roomid}&room${property}=${
						$(`#${property}`).contents().get(0).nodeValue
					}`,
					{ method: 'put' }
				)
					.then((response) => {
						return response.json();
					})
					.then((result) => {
						if (result == 'success')
							socket.emit('roomdatachanged', { roomid, adminid });
					});
			});
		});
	}

	socket.emit('joinroom', { roomid, adminid });

	socket.on('roomdata', (room) => {
		if (room == 'not found') {
			$('body').html('');
			$('body').css('background-color', 'white');
			$('body').append('not found');
		} else {
			let admin = false;
			//-------updating the data------------------
			$('.header').html('');
			$('.sidebar ul').html('');

			//checking.. login user is admin or not---------------------------------
			room.users.forEach((user) => {
				if (user.id == adminid) {
					if (user.admin) admin = true;
				}
			});
			profileurl = `/upload/${room.img}`;
			if (admin) {
				if (room.img) {
					$('.header')
						.append(`   <div class="roomname"> <div class="image"> <img src=${profileurl} alt=""><label for="roomprofilepic"> <i class="fas fa-camera"></i></label></div><span id="namefield">Name:</span> <span id="name"> ${room.roomname}<i class="far fa-edit" id="nameedit"></i><span contenteditable="false" id="savename">Save</span></span></div>
			   `);
				} else {
					$('.header')
						.append(`   <div class="roomname"> <div class="image"> <img  alt=""><label for="roomprofilepic"> <i class="fas fa-camera"></i></label></div><span id="namefield">Name:</span> <span  id="name"> ${room.roomname}
				<i class="far fa-edit" id="nameedit"></i><span contenteditable="false" id="savename">Save</span></span></div>
			   `);
				}
				$('.header').append(
					` <span id="descfield">Description:</span>
				<p id="desc">${room.desc} <i class="far fa-edit" id="descedit"></i><span contenteditable="false" id="savedesc">Save</span></p>`
				);
				changeroom_name_desc('desc');
				changeroom_name_desc('name');
				changeimage();

				room.users.forEach((user) => {
					setclass = setclasses(user);

					userprofilelink = `/profile/?userid=${user.id}`;
					if (adminid == user.id) {
						$('.sidebar ul')
							.append(`  <li class=${setclass.user}><a href=${userprofilelink}> <i class="fas fa-user  "></i>${user.name}</a>   
                    <span id="admin">Admin(you)</span></li>`);
					} else if (user.admin) {
						$('.sidebar ul')
							.append(`<li class=${setclass.user}>  <a href=${userprofilelink}> <i class="fas fa-user  "></i>${user.name}</a>   
                 <span id="removefromadmin" class=${setclass.removefromadmin}>Remove from Admin</span></li>`);

						//  -------------------------------------------------- removing from admin-----------------------------------
						$(`.${setclass.removefromadmin}`).click(() => {
							permission = confirm('User will be removed from admin..');
							if (permission == true) {
								fetch(
									`/removefromadmin?roomid=${room._id}&userid=${user.id}&adminid=${adminid}`,
									{ method: 'put' }
								)
									.then((response) => {
										return response.json();
									})
									.then((result) => {
										if (result == 'success') {
											socket.emit('roomdatachanged', { roomid, adminid });
										} else {
											console.log('result is not success');
										}
									});
							}
						});
					} else {
						$('.sidebar ul')
							.append(` <li class=${setclass.user}> <a href=${userprofilelink}> <i class="fas fa-user  "></i>${user.name}</a>   
                    <span id="makeadmin"  class=${setclass.makeadmin}>Make Admin</span></li>`);

						//  -------------------------------------------------- making admin-----------------------------------
						$(`.${setclass.makeadmin}`).click(() => {
							permission = confirm('user will become admin');
							if (permission == true) {
								fetch(
									`/makeadmin?roomid=${room._id}&userid=${user.id}&adminid=${adminid}`,
									{ method: 'put' }
								)
									.then((response) => {
										return response.json();
									})
									.then((result) => {
										if (result == 'success') {
											socket.emit('roomdatachanged', { roomid, adminid });
										}
									});
							}
						});
					}
				});
			} else {
				if (room.img) {
					$('.header')
						.append(` <div class="roomname"> <div class="image"> <img src=${profileurl} alt=""></div><span id="namefield">Name:</span> <span id="name"> ${room.roomname}
					</div>  `);
				} else {
					$('.header')
						.append(` <div class="roomname"> <div class="image"> <img  alt=""></div><span id="namefield">Name:</span> <span id="name"> ${room.roomname}
					</div>    `);
				}

				$('.header').append(`<span id="descfield">Description:</span>
			<p id="desc">${room.desc} </p>`);

				room.users.forEach((user) => {
					setclass = setclasses(user);

					userprofilelink = `/profile/?userid=${user.id}`;
					if (user.admin) {
						$('.sidebar ul')
							.append(`<li class=${setclass.user}>  <a href=${userprofilelink}> <i class="fas fa-user  "></i>${user.name}</a>   
               <span id="admin">Admin</span></li>`);
					} else {
						if (adminid == user.id) {
							$('.sidebar ul')
								.append(`  <li class=${setclass.user}><a href=${userprofilelink}> <i class="fas fa-user  "></i>${user.name}</a>   
                    <span id="admin">you</span></li>`);
						} else
							$('.sidebar ul').append(
								` <li class=${setclass.user}> <a href=${userprofilelink}> <i class="fas fa-user  "></i>${user.name}</a></li> `
							);
					}
				});
			}
		}
	});
	socket.on('oldmsgs', (msgs) => {
		let lastseen;
		for (i = msgs.length - 1; i > 0; i--) {
			if (msgs[i].senderid == adminid) {
				lastseen = i;
				break;
			}
		}
		for (i = 0; i < msgs.length; i++) {
			if (msgs[i].senderid == adminid) {
				for (j = i; j <= lastseen; j++) {
					if (msgs[j].text != '') {
						if (msgs[j].senderid == adminid) {
							if (msgs[j].msgtype == 'image') {
								$('.msgsarea')
									.append(`<div class="align-right"><div class=msgs><p class="name"></p> <p class="text"> <img src=/upload/${msgs[j].text}></p>
									<p class="time">${msgs[j].msgtime}</p></div></div><br>`);
							} else
								$('.msgsarea')
									.append(`<div class="align-right"><div class=msgs><p class="name"></p> <p class="text">${msgs[j].text}</p>
			        	<p class="time">${msgs[j].msgtime}</p></div></div> <br>`);
						} else {
							if (msgs[j].msgtype == 'image') {
								$('.msgsarea')
									.append(`<div class=msgs><p class="name">${msgs[j].sendername}</p> <p class="text"> <img src=/upload/${msgs[j].text}></p>
									<p class="time">${msgs[j].msgtime}</p></div><br>`);
							} else
								$('.msgsarea')
									.append(`<div class=msgs><p class="name">${msgs[j].sendername}</p> <p class="text">${msgs[j].text}</p>
			        	<p class="time">${msgs[j].msgtime}</p></div> <br>`);
						}
					}
				}
				msgsarea = document.querySelector('.msgsarea');
				msgsarea.scrollBy(0, msgsarea.scrollHeight - msgsarea.clientHeight);
				//---------unread msgs start from here-------------------------------
				count = 0;

				for (k = lastseen + 1; k < msgs.length; k++) {
					if (msgs[k].text != '') {
						if (count == 0) {
							$('.msgsarea').append(
								'<div class="unreadmsgs">Unread Msgs</div>'
							);
							count++;
						}
						if (msgs[k].msgtype == 'image') {
							$('.msgsarea')
								.append(`<div class=msgs><p class="name">${msgs[k].sendername} </p> <p class="text"> <img src=/upload/${msgs[k].text}></p>
								<p class="time">${msgs[k].msgtime}</p></div><br>`);
						} else
							$('.msgsarea')
								.append(`<div class=msgs><p class="name">${msgs[k].sendername}</p> <p class="text">${msgs[k].text}</p>
			                 	<p class="time">${msgs[k].msgtime}</p></div> <br>`);
					}
				}

				break;
			}
		}
	});
	socket.on('msg', ({ formatedmsg, sendername, senderid, msgtype }) => {
		if (senderid == adminid) {
			if (msgtype == 'image') {
				$('.msgsarea')
					.append(`<div class="align-right"><div class=msgs><p class="name"></p> <p class="text"> <img src=/upload/${formatedmsg.msg}></p>
		            <p class="time">${formatedmsg.time}</p></div></div><br>`);
			} else
				$('.msgsarea')
					.append(`<div class="align-right"><div class=msgs><p class="name"></p> <p class="text">${formatedmsg.msg}</p>
		             <p class="time">${formatedmsg.time}</p></div></div><br>`);
		} else {
			if (msgtype == 'image') {
				$('.msgsarea')
					.append(`<div class=msgs><p class="name">${sendername} </p> <p class="text"> <img src=/upload/${formatedmsg.msg}></p>
	            	<p class="time">${formatedmsg.time}</p></div><br>`);
			} else
				$('.msgsarea')
					.append(`<div class=msgs><p class="name">${sendername}</p> <p class="text">${formatedmsg.msg}</p>
		            <p class="time">${formatedmsg.time}</p></div><br>`);
		}

		msgsarea.scrollBy(0, msgsarea.scrollHeight - msgsarea.clientHeight);
	});

	$('#uploadphotoingrp').change(() => {
		fetch(`/uploadphotoingrp`, {
			method: 'post',
			body: new FormData(uploadphotoingrpform),
		})
			.then((response) => {
				return response.json();
			})
			.then((result) => {
				socket.emit('usermsg', { adminid, roomid, msg: result, type: 'image' });
				$('#uploadphotoingrp').val('');
			});
	});
	$('#form').submit((e) => {
		e.preventDefault();
		msg = $('#input').val();
		$('#input').val('');
		if (msg.trim().length > 0) {
			//--------------------------increasing count of msgs for this user---------------------
			fetch(`/countmsgs?userid=${adminid}`, { method: 'put' })
				.then((response) => {
					return response.json();
				})
				.then((result) => {
					if (result == 'success') {
					}
				});
			socket.emit('usermsg', { adminid, roomid, msg, type: 'text' });
		}
	});
});
