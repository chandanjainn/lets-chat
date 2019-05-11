const socket = io();

const sendButton = document.querySelector('#send'),
	sendLocationButton = document.querySelector('#location'),
	$message = document.querySelector('[name="message"]'),
	messages = document.querySelector('#messages'),
	messageTemplate = document.querySelector('#message-template').innerHTML,
	roomTemplate = document.querySelector('#room-template').innerHTML,
	locationTemplate = document.querySelector('#location-template').innerHTML;

const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true
});

const autoscroll = () => {
	// New message element
	const $newMessage = messages.lastElementChild;

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible height
	const visibleHeight = messages.offsetHeight;

	// Height of messages container
	const containerHeight = messages.scrollHeight;

	// How far have I scrolled?
	const scrollOffset = messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		messages.scrollTop = messages.scrollHeight;
	}
};

socket.on('message', message => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

sendButton.addEventListener('click', e => {
	e.preventDefault();
	sendButton.setAttribute('disabled', 'disabled');
	socket.emit('sendMsg', $message.value, error => {
		sendButton.removeAttribute('disabled');
		$message.value = '';
		$message.focus();
		if (error) {
			return console.log(error);
		}
	});
});

sendLocationButton.addEventListener('click', e => {
	e.preventDefault();
	sendLocationButton.setAttribute('disabled', 'disabled');
	if (!navigator.geolocation) {
		return alert('Browser does not support geolocation');
	}
	navigator.geolocation.getCurrentPosition(function() {}, function() {}, {});
	navigator.geolocation.getCurrentPosition(position => {
		socket.emit(
			'SendLocation',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.latitude
			},
			ack => sendLocationButton.removeAttribute('disabled')
		);
	});
});

socket.on('locationMessage', location => {
	const html = Mustache.render(locationTemplate, {
		username: location.username,
		location: location.url,
		createdAt: moment(location.createdAt).format('hh:mm a')
	});
	messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.emit('join', { username, room }, error => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});

socket.on('usersInRoom', ({ room, users }) => {
	const html = Mustache.render(roomTemplate, {
		users,
		room
	});
	document.querySelector('#sidebar').innerHTML = html;
});
