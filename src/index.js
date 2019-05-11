require('dotenv').config();

const express = require('express'),
	path = require('path'),
	http = require('http'),
	socketio = require('socket.io'),
	Filter = require('bad-words'),
	{ generateMessage, generateLocMessage } = require('./utils/messages'),
	{
		addUser,
		removeUser,
		getUser,
		getAllUsersInRoom
	} = require('./utils/users');

const app = express(),
	server = http.createServer(app),
	io = socketio(server),
	port = process.env.PORT,
	publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', socket => {
	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room });
		if (error) {
			return callback(error);
		}

		socket.join(user.room);
		io.to(user.room).emit('usersInRoom', {
			room: user.room,
			users: getAllUsersInRoom(user.room)
		});

		socket.emit('message', generateMessage('Admin', 'Welcome'));
		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				generateMessage('Admin', `${user.username} has joined the room`)
			);
		callback();
	});

	socket.on('sendMsg', (message, callback) => {
		const user = getUser(socket.id);
		console.log(user.room);
		console.log(message);

		const filter = new Filter();
		if (filter.isProfane(message)) {
			return callback('Language!!');
		}
		io.to(user.room).emit('message', generateMessage(user.username, message));
		callback('Delivered !!');
	});

	socket.on('SendLocation', (coords, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit(
			'locationMessage',
			generateLocMessage(
				user.username,
				`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
			)
		);
		callback('Location shared');
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit(
				'message',
				generateMessage('Admin', `${user.username} has left`)
			);
			io.to(user.room).emit('usersInRoom', {
				room: user.room,
				users: getAllUsersInRoom(user.room)
			});
		}
	});
});

server.listen(port, () => {
	console.log('Server is up at port ', port);
});
