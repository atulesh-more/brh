import VanillaRouter from './router.js'
import {
	h
} from "https://unpkg.com/gridjs?module";

function switchToSubdomain(url, subdomain, path) {
	return `${window.location.protocol}//${subdomain + '.' + window.location.host}/${path}`;
}	

function switchToSubdomainWSS(url, subdomain, path) {
	return `${'wss:'}//${subdomain + '.' + window.location.host}/${path}`;
}	

var page_index = 0;
var actionStatus = false;
var inviteToken = "";
var canvas;
const router = new VanillaRouter({
	type: 'history',
	routes: {
		'/': 'home',
		'/join-session': 'login',
		'/about': 'about',
		'/contact': 'contact',
		'/services': 'services',
		'/programs': 'programs',
		'/payment': 'payment',

		'/subscription': 'subscription',
		'/affiliate': 'affiliate',
		'/affiliate-dashboard': 'affiliate_dashboard',

		'/audio-conferencing-platform': 'conference',
		'/audio-conferencing-platform/my-payment': 'mypayment',
		'/audio-conferencing-platform/my-account': 'myaccount',

		'/privacy': 'privacy',
		'/disclaimer': 'disclaimer',
		'/agreements': 'agreements', 

	},
})

const SIGNALING_SERVER_URL = switchToSubdomainWSS(window.location.href,'api','stream/user/');
//'wss://api.brh.lcom:8443/stream/user/';
//switchToSubdomain(window.location.href, 'api', 'rest-api/user/validate-token')
// user.js
// getAudioContext().resume();
// const audioContext = new (window.AudioContext || window.webkitAudioContext)();

var socket;
var userAudio = document.getElementById('userAudio');
let peerConnection;
var audioContext;
let mediaSource;
let analyser;
var timestamp_past_session;
var past_sessions = [];
var intervalId, intervalID;
var seconds = 59;
var minutes = 29;
var prev_adminIdlelModal;
var prev_yesUserBtn;
audioContext = new (window.AudioContext || window.webkitAudioContext)();
function updateClock() {
	// Increment seconds and minutes
	

	// Format the time
	var timeString = minutes.toString().padStart(2, '0') + ' : ' + seconds.toString().padStart(2, '0');

	// Update the clock display
	document.getElementById('live_session_playing_timer1').textContent = '⌛ ' + timeString;
	seconds--;
	if (seconds == -1) {
		seconds = 59;
		minutes--;
		if (minutes == -1) {
			minutes = 29;
		}
	}
}
function initCanvas(audioElementId, video_type) {
	const audioElement = document.getElementById(audioElementId);
	// if (!mediaSource || mediaSource.mediaElement !== audioElement) {
	// 	if (mediaSource) {
	// 	  mediaSource.disconnect();
	// 	}
	// 	mediaSource = audioContext.createMediaElementSource(audioElement);
	//   }		
	mediaSource.connect(analyser);
	
	// Start/resume the audio context
	audioContext.resume();
	
	// Start drawing the visualization
	draw(analyser, video_type);
}
function draw(analyser, video_type) {
	var container;
	if (video_type >= 0){
		container = document.getElementById('audio-player-bar-container');
	}
	else container = document.getElementById('container-audio-live');
	const canvasCtx = canvas.getContext('2d');
	// analyser.fftSize = 2048;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	canvas.style='width: 100%;height:100%;';

	function renderFrame() {
	  requestAnimationFrame(renderFrame);
	  analyser.getByteFrequencyData(dataArray);
	  
	  canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
	  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
	  
	  const barWidth = (canvas.width / bufferLength) * 5; // Adjusted bar width
	  let x = 0;
	  
	  for(let i = 0; i < bufferLength; i++) {
		const amplitude = dataArray[i] / 255; // Normalize to range [0, 1]
		const barHeight = canvas.height * amplitude;
		// const red = amplitude * 255;
		// const blue = 255 - (amplitude * 255);
		const red = 255;
		const blue = 255;
		
		canvasCtx.fillStyle = 'rgb(0, 0, 0, ' + amplitude + ')';
		canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
		
		x += barWidth;
	  }
	}
	
	renderFrame();
  }
function initAudioPlayer(video_types) { 
	userAudio = document.getElementById('userAudio');
	var userEmail = localStorage.getItem('brh_root_email');
	if (video_types >= 0){
		socket = new WebSocket(SIGNALING_SERVER_URL + 'listener' + '/' + userEmail);
		canvas = document.getElementById('canvas_past_sessions');
	}
	else {
		socket = new WebSocket(SIGNALING_SERVER_URL + 'user' + '/' + userEmail);
		canvas = document.getElementById('canvas_live_sessions');	
	}	
	/* atlers1 // this block was throwing error
	var close_session_modal_btn = document.getElementById("close_live_session_btn");
	close_session_modal_btn.addEventListener("click", function () {
		clearInterval(updateClock);
		var audioElement = document.getElementById('userAudio');
		audioElement.pause();
	}, true); */// Use capturing to ensure this runs before any other focus events	
	// user.js
	initSocket();
	//atlers loading js for audio player

	
	
	var pingInterval = 30000;
	// Set a variable to store the ping message
	var pingMessage = "ping";
	// Set a variable to store the ping timer ID
	var pingTimer = null;
	let sId;
	function sendPing() {
		// Send the ping message as a text frame
		if (socket.readyState == WebSocket.OPEN)
			socket.send(pingMessage);
		// Log the ping message
		console.log("Sent: " + pingMessage);
	}
	// Define a function to start the ping timer
	function startPing() {
		// Stop the previous ping timer if any
		stopPing();
		// Start a new ping timer with the ping interval
		pingTimer = setInterval(sendPing, pingInterval);
	}
	// Define a function to stop the ping timer
	function stopPing() {
		// Clear the ping timer if any
		if (pingTimer) {
			clearInterval(pingTimer);
			pingTimer = null;
		}
	}

	function initSocket() {

		
		socket.onopen = () => {
			console.log('Connected to signaling server as user');
			startPing();
		};

		socket.onmessage = (event) => {
			if (event.data instanceof Blob) {
				const blobUrl = URL.createObjectURL(event.data);
				const audioElement = document.getElementById('userAudio');
				audioElement.src = blobUrl;
				// audioElement.play();
				if (!mediaSource || mediaSource.mediaElement !== audioElement) {
					if (mediaSource) {
					  mediaSource.disconnect();
					}
					mediaSource = audioContext.createMediaElementSource(audioElement);
				}	
				analyser = audioContext.createAnalyser();
				  
				analyser.connect(audioContext.destination);
				initCanvas('userAudio', video_types);
				return;
			}
			if (event.data == "ping")
				return;
			const data = JSON.parse(event.data);
			console.log('onmessage', data);
			switch (data.type) {
				case 'login':
					sId = data.data;
					console.log("my id is " + sId);
					// handleLogin();
					break;
				case 'login-failure':
					window.location.href = '/join-session';
					show_adminIdleModal('Concurrent session can not be exist at once.', 2);
					break;
				case 'offer':
					handleOffer(data.data);
					break;
				case 'answer':
					handleAnswer(data.data);
					break;
				case 'ice-candidate':
					handleIceCandidate(data.data);
					break;
				case 'request-play':
					handleRequestPlayData(data.data);
					break;
				case 'admin-disconnected':
					socket.close();
					if(page_index==1)
					{
						show_adminIdleModal('The admin has not started this live session.', 1);
					} 
					if (peerConnection != undefined)
						peerConnection.close();

				case 'error':
					socket.close();
					break;
			}
		};

		socket.onclose = () => {
			stopPing();
			console.log('Disconnected from signaling server');
		};

		socket.onerror = (error) => {
			console.error('WebSocket error: ', error);
		};


		//edit for request play
		// if (video_types != '0') {
		// 	// video_types = '1', '2', '3', '4', '5'
		// 	console.log("request_play");
		// 	socket.send(JSON.stringify({
		// 		type: 'request-play'
		// 	}));
		// }

	}
	function handleLogin() {
		socket.send(JSON.stringify({
			type: 'log-in',
			data: {
				email: localStorage.getItem('brh_root_email')
			},
		}));
	}
	function handleOffer(data) {
		console.log('handling offer in user.js');
		createPeerConnection();
		peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
			.then(() => peerConnection.createAnswer())
			.then(answer => peerConnection.setLocalDescription(answer))
			.then(() => {
				socket.send(JSON.stringify({
					type: 'answer',
					data: {
						target: data.sender,
						answer: peerConnection.localDescription,
						sender: sId
					},
				}));
			});
	}

	function handleAnswer(data) {
		console.log('handling ice candidate1 ....');
		if (peerConnection) {
			console.log('handling ice candidate3 ....');
			peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
		}
	}

	function handleIceCandidate(data) {
		console.log('handling ice candidate2 ....');
		if (peerConnection) {
			console.log('handling ice candidate ....'); 

			peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
	}
	function handleRequestPlayData(data) {
		if (video_types == -1)
			socket.send(JSON.stringify({
				type: 'request-play',
				data: {
					target: 'admin',  // Replace with the actual admin ID
					file: data.file,
					sender: sId
				},
			}));
		else
			socket.send(JSON.stringify({
				type: 'request-play',
				data: {
					target: 'admin',  // Replace with the actual admin ID
					file: past_sessions[video_types]['filename'],
					sender: sId
				},
			}));
	}
	function createPeerConnection() {
		peerConnection = new RTCPeerConnection();

		peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				socket.send(JSON.stringify({
					type: 'ice-candidate',
					data: {
						target: 'admin',  // Replace with the actual admin ID
						candidate: event.candidate,
						sender: sId
					},
				}));
			}
		};

		// const audioStream = audioContext.createMediaStreamDestination().stream;
		// audioStream.getTracks().forEach(track => peerConnection.addTrack(track, audioStream));
		// console.log(userAudioStream, "this is userAudioStream");
		// peerConnection.addStream(userAudioStream);
		// userAudioStream.getTracks().forEach((track) => {
		// 	peerConnection.addTrack(track, userAudioStream);
		// });

		//  when a remote user adds stream to the peer connection, we display it 
		peerConnection.ontrack = function(event) {
			console.log('ontrack', event);
			if (event.track.kind === 'audio') {
				const audioStream = event.streams[0];
				// audioStream.addTrack(event.track);
				userAudio.srcObject = audioStream;
	
				// Connect the audio stream to the AnalyserNode for visualization
				analyser = audioContext.createAnalyser();
				mediaSource = audioContext.createMediaStreamSource(audioStream);
				mediaSource.connect(analyser);
				analyser.connect(audioContext.destination);
				var panner = audioContext.createPanner();
				panner.setPosition(0, 0, 0);
				panner.connect(audioContext.destination);
				// Initialize the canvas for visualization
				initCanvas('userAudio', video_types);
			}
		};
		// peerConnection.onaddstream = function (e) {
		// 	console.log('addstreaming into peerConnectino in user.js', e.stream);
		// 	userAudio.srcObject = e.stream;
		// 	// userAudio.play();
			
		// 	mediaSource = audioContext.createMediaStreamSource(e.stream);
		// 	// alert('dddssss')
		// 	analyser = audioContext.createAnalyser();
		// 	mediaSource.connect(analyser);
		// 	analyser.connect(audioContext.destination);
		// 	var panner = audioContext.createPanner();
		// 	panner.setPosition(0, 0, 0);
		// 	panner.connect(audioContext.destination);
		// 	initCanvas('userAudio', video_types);
		// };

		return peerConnection;
	}
	
}

router.listen().on('route', async (e) => {
	console.log(e);

	document.getElementById('header-content').classList.add('hidden');
	window.scrollTo({ top: 0, behavior: 'smooth' })
	const token = localStorage.getItem('brh_root_token');
	let isValidToken = false;
	if (e.detail.route != 'home' && e.detail.route != 'login' && e.detail.route != 'affiliate' && e.detail.route != 'affiliate-dashboard' && e.detail.route != 'affiliate_dashboard' && e.detail.route != 'privacy' && e.detail.route != 'disclaimer' && e.detail.route != 'agreements') {
		const response = await fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/validate-token'), {// fetch('https://api.brh.lcom:8443/rest-api/user/validate-token', {

			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
		});
		if (response.status != 200) {
			isValidToken = true;
		}
	}

	/* privacy page showing problem while token */
	if (e.detail.route === "privacy") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/privacy_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	}
	/* privacy page showing problem while token */

	/* disclaimer page showing problem while token */
	if (e.detail.route === "disclaimer") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/disclaimer_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	}
	/* disclaimer page showing problem while token */

	/* disclaimer page showing problem while token */
	if (e.detail.route === "agreements") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/user_agreement_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	}
	/* disclaimer page showing problem while token */

	if (isValidToken) {
		window.location.href = "/join-session";
		return;
	}
	if (e.detail.route === "home") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/home_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "login") {
		localStorage.removeItem('brh_root_token');
		localStorage.removeItem('brh_root_email');
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/login_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "conference") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/conference_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
			document.getElementById('header_user_name').innerText = localStorage.getItem('brh_root_username', '');
		})

		if (e.detail.url.pathname === "/audio-conferencing-platform/mypayment") {
			document.getElementById('header-content').classList.remove('hidden');
			fetch('pages/header/mypayment_header.html').then((response) => response.text()).then((htmlData) => {
				document.getElementById('header-content').innerHTML = htmlData;
				document.getElementById('header_user_name').innerText = localStorage.getItem('brh_root_username', '');
			})
		} else if (e.detail.url.pathname === "/audio-conferencing-platform/myaccount") {
			document.getElementById('header-content').classList.remove('hidden');
			fetch('pages/header/account_header.html').then((response) => response.text()).then((htmlData) => {
				document.getElementById('header-content').innerHTML = htmlData;
				document.getElementById('header_user_name').innerText = localStorage.getItem('brh_root_username', '');
			})
		}
	} else if (e.detail.route === "subscription") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/subscription_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})

	} else if (e.detail.route === "payment") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/payment_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "privacy") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/privacy_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "disclaimer") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/disclaimer_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "affiliate") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/affiliate_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "affiliate_dashboard") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/affiliate_dashboard_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	}
	await (() => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve('resolved');
			}, 100);
		});
	})()
	var htmlFile = e.detail.route;
	console.log(htmlFile, e.detail.route, e.detail.url.pathname);

	if (e.detail.url.pathname == "/audio-conferencing-platform/my-payment")
		htmlFile = 'mypayment';
	if (e.detail.url.pathname == "/audio-conferencing-platform/my-account")
		htmlFile = 'myaccount';
	console.log(htmlFile);
	clearInterval(intervalId);
	fetch('pages/' + htmlFile + '.html').then((response) => response.text()).then((htmlData) => {
		document.getElementById('main-content').innerHTML = htmlData
		document.querySelectorAll('.menu ul li a').forEach(function (elem) {
			if (elem.href.endsWith(htmlFile) || (elem.href.endsWith("/") && htmlFile == 'main')) {
				elem.parentElement.classList.add('active')
			} else {
				elem.parentElement.classList.remove('active');
			}
		});
		if (htmlFile === "conference") {
			page_index = 1;
			decide_conference_type();
			upcoming_calendar(); 
			/*
			const joinBtn = document.getElementById('joinBtn');
			joinBtn.addEventListener("click", () => {
				if (socket != undefined && socket.readyState === WebSocket.OPEN)
					socket.close();
				initAudioPlayer('0');
			});
			*/

		}
		if (htmlFile === "home")
		{
			page_index = 2;
			
			home_function();
		}
		if (htmlFile === "login") {
			page_index = 3;
			const str2 = e.detail.path;
			const str1 = e.detail.url.pathname;
			const difference = str1.replace(str2, "").replace(/^\/|\/$/g, "");
			login_function(difference);
		}
		if (htmlFile == 'subscription') {
			page_index = 4;
			const str2 = e.detail.path;
			const str1 = e.detail.url.pathname;
			const difference = str1.replace(str2, "").replace(/^\/|\/$/g, "");
			if (difference != "") {
				const btn_back = document.getElementById("btn-back");
				btn_back.setAttribute('href', '/audio-conferencing-platform/my-payment');
				btn_back.innerText = "Back";
			}
		}
		if (htmlFile === "myaccount")
		{
			page_index = 5;
			my_account();
		}
		if (htmlFile == 'mypayment')
		{
			page_index = 6;
			mypayment_init();
		}
		if (htmlFile === 'payment') {
			
			page_index = 7;
			
			document.getElementById("card_number").addEventListener("input", function(event) {
				const input = event.target.value;
			
				// Remove non-digit characters
				const sanitizedInput = input.replace(/\D/g, '');
			
				// Truncate input to 16 digits
				const truncatedInput = sanitizedInput.slice(0, 16);
			
				// Update input field value
				event.target.value = truncatedInput;
			});
			
			document.getElementById("card_expiry").addEventListener("input", function(event) {
				const input = event.target.value;
			
				// Remove non-digit characters
				const sanitizedInput = input.replace(/\D/g, '');
			
				// Format input as "MM / YY"
				let formattedInput = '';
				for (let i = 0; i < sanitizedInput.length; i++) {
					if (i === 2) {
						formattedInput += ' - ' + sanitizedInput[i];
					} else {
						formattedInput += sanitizedInput[i];
					}
				}
				// Limit input to 3 digits
				const truncatedInput = formattedInput.slice(0, 7);
				// Update input field value
				event.target.value = truncatedInput;

			 
			 
			});
			document.getElementById("card_cvv").addEventListener("input", function(event) {
				const input = event.target.value;
			
				// Remove non-digit characters
				const sanitizedInput = input.replace(/\D/g, '');
			
			 // Limit input to 3 digits
			 const truncatedInput = sanitizedInput.slice(0, 4);

			 // Update input field value
			 event.target.value = truncatedInput;
		 

			 
			 
			});
			

			
			const str2 = e.detail.path;
			const str1 = e.detail.url.pathname;
			const difference = str1.replace(str2, "").replace(/^\/|\/$/g, "");

			payment_init(difference);
		}
		if (htmlFile == 'affiliate-dashboard' || htmlFile == 'affiliate_dashboard') {
			page_index = 8;
			affiliate_dashboard_function();
		}
		if (htmlFile == 'affiliate') {
			page_index = 9;
			affiliate_function();
		}
	}).catch(err => { console.log() })
})

function checkAccountAciveConference() {
	if (actionStatus != 'active') {
		show_adminIdleModal('You are not permitted to take this action!', 0);
		return false;
	}
	return true
}
function show_adminIdleModal(modal_content, modal_type){ 
	console.log('sss');
	prev_adminIdlelModal = document.getElementById("adminidle_adminDefaultModal");
	const conference_error_modal_title = document.getElementById('conference_error_modal_title');
	conference_error_modal_title.textContent = modal_content;
	prev_yesUserBtn = document.getElementById("adminidle_useradminprocedureYesBtn"); 
	prev_yesUserBtn.onclick = function () {
		console.log(prev_adminIdlelModal);
		prev_adminIdlelModal = document.getElementById("adminidle_adminDefaultModal");
		prev_adminIdlelModal.setAttribute('style', 'diplay:none!important;'); 
		if (modal_type == 1)
			window.location.href = '/audio-conferencing-platform';
		if (modal_type == 2)
		window.location.href = '/join-session';
	} 
	prev_adminIdlelModal.style.display = "block";
}
function payment_init(price) {

	price = Number(price);
	const pay_btn = document.getElementById('pay_btn');
	let intervalUnit = "Day";
	let intervalLength = 1;
	switch (price) {
		case 59.99:
			intervalUnit = "Month";
			break;
		case 99.99:
			intervalUnit = "2 Months";
			intervalLength = 2;
			break;
		case 499.99:
			intervalUnit = "Year";
			intervalLength = 1;
			break;
	}
	
	const prices_spans = document.getElementsByClassName('pay-price');
	for(let i = 0; i < prices_spans.length; i++) {
		let price_tag = prices_spans[i];
		price_tag.innerHTML = '$' + price;
	}
	const intervalUnitTag = document.getElementById('super-month');
	intervalUnitTag.innerHTML = '/' + intervalUnit;

	paypal.Buttons({
		createOrder: function(data, actions) {
			return actions.order.create({
				purchase_units: [{
					amount: {
						value: price // Change this to your desired amount
					}
				}]
			});
		},
		onApprove: function(data, actions) {
			return actions.order.capture().then(function(details) {
				console.log(details); 
				// Call your server to save the transaction
				pay_bill_paypal(price);
			});
		},
		onError: function(err) {
			console.error(err);
			showDefaultModal("Transaction Failed");	
		}
	}).render('#paypal-button-container');

	pay_btn.addEventListener("click", () => {
		pay_bill(price);
	});
}

function mypayment_init() {
	const token = localStorage.getItem('brh_root_token');
	const param = {
		"email": localStorage.getItem('brh_root_email'),
	};
	//fetch('https://api.brh.lcom:8443/rest-api/user/payment-info', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/payment-info'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {
			document.getElementById('next_billing_date').innerText = data.nextBillDate;
			if (data.activeStatus != "active")
				document.getElementById('btn_proceed_payment').setAttribute('href', '/subscription/next-billing');
			if (data.activeStatus == "active") {
				const payment_current_title = document.getElementById('payment-current-title');
				const current_payment_card = document.getElementById('current-payment-card');
				payment_current_title.setAttribute('style', 'display:none;');
				current_payment_card.setAttribute('style', 'display:none;');
			}
			console.log(data.activeStatus, data.nextBillDate, data.transactionLogs);
			var transactionLogsDiv = document.getElementById('div_transaction_logs');
			let text_html = '';
			for (var i = 0; i < data.transactionLogs.length; i++) {
				var log = data.transactionLogs[i];
				text_html += ("\
					<article class= 'postcard light blue order-detail-card' >\
						<div class='postcard__text t-dark'>\
							<h1 class='postcard__title blue'><a href='#'>"+ log.start_date + "</a></h1>\
							<div class='order-card-panel row'>\
								<div class='order-detail-panel-1 col-md-4'>\
									<div class='postcard__preview-txt'>Order Details</div>\
									<div class='postcard__subtitle small'>Package N#"+ log.id + "</div>\
									<div class='postcard__subtitle small'>From "+ log.start_date + "</div>\
									<div class='postcard__subtitle small'>Until "+ log.end_date + "</div>\
								</div>\
								<div class='order-detail-panel-2 col-md-5'>\
									<div class='postcard__preview-txt'>Amount Paid</div>\
									<div class='postcard__subtitle small'>"+ log.price + " USD</div>\
								</div>\
								<div class='order-detail-panel-3 col-md-3'>\
									<div class='postcard__preview-txt'>Approved</div>\
									");
								if(log.card_cvv != "pal")
								{
									text_html += ("\
									<div class='postcard__subtitle small'>Card ending "+ log.card_number.slice(-4) + "</div>\
									");
								}
								else
								{
									text_html += ("\
									<div class='postcard__subtitle small'>PayPal</div>\
									");
								}
					text_html += ("\
								</div>\
							</div>\
						</div>\
					</article>\
					<hr class='my-1'>\
				");
			}
			transactionLogsDiv.innerHTML = text_html;


		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}


function pay_bill_paypal(price){
 
 
	let intervalUnit = "DAYS";
	let intervalLength = 1;
	switch (price) {
		case 59.99:
			intervalUnit = "MONTHS";
			break;
		case 99.99:
			intervalUnit = "MONTHS";
			intervalLength = 2;
			break;
		case 499.99:
			intervalUnit = "YEARS";
			intervalLength = 1;
			break;

	} 
	let card_cvv = "pal";
	let card_number = "****************";
	var paymentData = {
		// "opaqueData": response.opaqueData,
		"dataDescriptor": "response.opaqueData.dataDescriptor",
		"dataValue": "response.opaqueData.dataValue",
		// Subscription details - adjust these values as needed
		"amount": price,
		"intervalLength": intervalLength,
		"intervalUnit": intervalUnit,
		"startDate": new Date().toISOString(), // Current date as start date
		"totalOccurrences": 1,
		"trialOccurrences": 0,
		"email": localStorage.getItem('brh_root_email'),
		'card_number': card_number,
		'card_cvv': card_cvv
	};

	var token = localStorage.getItem('brh_root_token');
	// Send `paymentData` to your server endpoint
	//fetch('https://api.brh.lcom:8443/rest-api/payment/createSubscription', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/payment/createSubscription'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}` 
		},
		body: JSON.stringify(paymentData)
	})
		.then(response => response.json())
		.then(data => {
			if (data.status == 'success'){
				showDefaultModal("Successfully Done", ()=> {
					window.location.href = '/audio-conferencing-platform';
			});
			}
			else showDefaultModal("Transaction Failed");		
		})
		.catch(error => console.error('Error:', error));

	 
}

function pay_bill(price) { 
	const card_number = document.getElementById('card_number').value;
	console.log(document.getElementById('card_expiry'));
	var card_expiry = document.getElementById('card_expiry').value;
	console.log(card_expiry);
	const card_cvv = document.getElementById('card_cvv').value;
	var authData = {
		//clientKey: "5FcB6WrfHGS76gHW3v7btBCE3HuuBuke9Pj96Ztfn5R32G5ep42vne7MCWZtAucY",
		//apiLoginID: "5KP3u95bQpv"

		clientKey: "3PSGzzeuJ44LbJWJ5b7fkJ5mB2pc8L2Lz46T7u5RFFw5RVQHen462nAswD8342rU",
		apiLoginID: "3gn78sWXS"

		// clientKey: "4Y4Js5rmtT",
		// apiLoginID: "25Ud24Hr6sDE2U6y"
	};
	card_expiry = '2024-10-20';
	const dates = card_expiry.split("-");
	var cardData = {
		cardNumber: document.getElementById("card_number").value,
		month: dates[1],
		year: dates[0],
		cardCode: document.getElementById("card_cvv").value
	};

	var secureData = { authData: authData, cardData: cardData };

	let intervalUnit = "DAYS";
	let intervalLength = 1;
	switch (price) {
		case 59.99:
			intervalUnit = "MONTHS";
			break;
		case 99.99:
			intervalUnit = "MONTHS";
			intervalLength = 2;
			break;
		case 499.99:
			intervalUnit = "YEARS";
			intervalLength = 1;
			break;

	}
	Accept.dispatchData(secureData, responseHandler);
	function responseHandler(response) { 
		if (response.messages.resultCode === "Ok") {
			 
		
		console.log("accept dispatch data = " , response.opaqueData.dataDescriptor);
		
		console.log("accept dispatch data = " , response.opaqueData.dataValue);
		 
		
			var paymentData = {
				// "opaqueData": response.opaqueData,
				"dataDescriptor": response.opaqueData.dataDescriptor,
				"dataValue": response.opaqueData.dataValue,
				// Subscription details - adjust these values as needed
				"amount": price,
				"intervalLength": intervalLength,
				"intervalUnit": intervalUnit,
				"startDate": new Date().toISOString(), // Current date as start date
				"totalOccurrences": 1,
				"trialOccurrences": 0,
				"email": localStorage.getItem('brh_root_email'),
				'card_number': card_number,
				'card_cvv': card_cvv,
				...response.opaqueData
			};
			var token = localStorage.getItem('brh_root_token');
			// Send `paymentData` to your server endpoint
			//fetch('https://api.brh.lcom:8443/rest-api/payment/createSubscription', {
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/payment/createSubscription'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}` 
				},
				body: JSON.stringify(paymentData)
			})
				.then(response => response.json())
				.then(data => {
					if (data.status == 'success'){
						showDefaultModal("Successfully Done", ()=> {
							window.location.href = '/audio-conferencing-platform';
					});
					}
					else showDefaultModal("Transaction Failed");		
				})
				.catch(error => console.error('Error:', error));
		} else {
			var procedureModal = document.getElementById("DefaultModal");
			// Get the buttons that opens the modal
			 
			showDefaultModal(response.messages.message[0].text);
			console.error("Error: " + response.messages.message[0].text);
			// Handle error
		}
	}
}

function getEvents(year, month) {
	const result = [];
	const firstDay = new Date(year, month - 1, 1);
	const lastDay = new Date(year, month, 0);

	for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
		// Check if the current day is not Wednesday (where Sunday is 0 and Saturday is 6)
		if (date.getDay() !== 3 && date.getDay() !== 0) {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const nowTime = new Date();
			const times = ['05:00:00', '08:00:00', '12:00:00', '16:00:00', '19:00:00'];
			const staticTimes = [5, 8, 12, 16, 19];
			times.forEach((time, index) => {
				const is_add = true;
				// console.log(index, date.getDate(), nowTime.getDate(), staticTimes[index], nowTime.getHours());
				// if (date.getDate() == nowTime.getDate() && staticTimes[index] < nowTime.getHours()) {
				// 	is_add = false;
				// }
				if (is_add)
					result.push({
						title: "Session",
						start: `${year}-${month}-${day}T${time}`,

					});
			});
		}
	}

	return result;
}
// Function to check if a date is Wednesday or Sunday
function isExcludedDay(date) {
	const dayOfWeek = date.getDay();
	return dayOfWeek === 0 || dayOfWeek === 3; // 0 is Sunday, 3 is Wednesday
}
function showDateEvents(eventDate) {
	const container_div = document.getElementById('audio-preview-past2');
	var htmlText = "";
	const staticTimes = [5, 8, 12, 16, 19];
	const nowTime = new Date();
	for (let i = 0; i < 24; i++) {
		const eventTime = `${eventDate.toISOString().split('T')[0]} ${i}:00:00`;
		const serverTime = convert_local_time(eventTime);
		
		// console.log(serverTime);
		if (staticTimes.indexOf(serverTime.getHours()) == -1)
			continue;
		if (isExcludedDay(serverTime))
			continue;
		// Create a new date for each event with the calculated start time
		const eventStart =  convert_upcoming_time(serverTime);
		if (eventStart.getDate() < nowTime.getDate() || eventStart.getMonth() < nowTime.getMonth()) {
			continue;
		}
		if (eventStart.getDate() == nowTime.getDate() && eventStart.getHours() <= nowTime.getHours()) {
			continue;
		}

		const options = { hour: 'numeric', hour12: true };
		const formattedTime = eventStart.toLocaleString('en-US', options);
		
		console.log(formattedTime);
		htmlText += `
			<div class="col-md-6 mb-4">
				<a class="audio-open-modal-past">
					<img src="/images/home/musicplayer_sandwatch.jpg" alt="Image ${i+1}"
						class="img-fluid audio-preview-img-upcoming">
				</a>
				<p class="time-to-play">${formattedTime}</p>
			</div>
		`;
	}
	container_div.innerHTML = htmlText;
}

function generateEvents() {
	const events = [];

	// Define start date
	const startDate = new Date();
	const curTime = startDate.getHours();

	// Loop to generate 100 events
	for (let i = 0; i < 1000; i++) {
		// Calculate start time based on the specified times each day
		const startTimes = ['05:00:00', '08:00:00', '12:00:00', '16:00:00', '19:00:00'];
		const startTimeIndex = i % startTimes.length;
		const startTime = startTimes[startTimeIndex];

		const nowTime = new Date();
		const staticTimes = [5, 8, 12, 16, 19];
		// Create a new date for each event with the calculated start time
		const eventDate = new Date(startDate);
		eventDate.setDate(startDate.getDate() + Math.floor(i / startTimes.length));
		const eventStart =  new Date(convert_upcoming_time(`${eventDate.toISOString().split('T')[0]} ${startTime}`));
		if (eventStart.getDate() == nowTime.getDate() && eventStart.getHours() <= nowTime.getHours()) {
			continue;
		}
		// Check if the date is Wednesday or Sunday; skip the event if true
		if (isExcludedDay(eventDate)) {
			continue;
		}
		// Add the event to the array
		events.push({
			title: 'Session',
			start: eventStart.toISOString(),
		});
	}
	return events;
}
function upcoming_calendar() {
	
	const calendarEl = document.getElementById('calendar');
	const currentDate = new Date();
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth() + 1;
	const events = getEvents(year, month);
	// Call the function to generate events
	const generatedEvents = generateEvents();
	var calendar = new FullCalendar.Calendar(calendarEl, {
		initialDate: new Date(),
		initialView: 'dayGridMonth',

		//		events: events,


		events: generatedEvents,


		select: function (arg) {
			const date = new Date(arg.start);
			let day = date.getDate();
			let month = date.getMonth();
			let year = date.getFullYear();
			showDateEvents(date);
			document.querySelector("#upcoming-session-modal-date").innerHTML = month + "/" + day + "/" + year;
			document.querySelector("#upcoming-session-modal-btn").click();
		},
	});

	calendar.render();
	calendar.on('dateClick', function(arg) {
		showDateEvents(arg.date);
		document.querySelector("#upcoming-session-modal-date").innerHTML = formatDateTime(arg.date);
		document.querySelector("#upcoming-session-modal-btn").click();
	  });
	const slidesContainer = document.getElementById("slides-container1");
	const slide = document.querySelector(".slide");
	const prevButton = document.getElementById("slide-arrow-prev1");
	const nextButton = document.getElementById("slide-arrow-next1");

	nextButton.addEventListener("click", () => {
		const slideWidth = slide.clientWidth;
		slidesContainer.scrollLeft += slideWidth;
	});

	prevButton.addEventListener("click", () => {
		const slideWidth = slide.clientWidth;
		slidesContainer.scrollLeft -= slideWidth;
	});
}

//conference type as past session play....
function decide_conference_type() {
	//Get the status of account type and decide the my account status and need to active letter and color
	const token = localStorage.getItem('brh_root_token');
	const param = {
		"email": localStorage.getItem('brh_root_email'),
	};
	//fetch('https://api.brh.lcom:8443/rest-api/user/conference-info', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/conference-info'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {



			let accountSwitch = document.getElementById('accountSwitch');
			let account_switch_title = document.getElementById('account_switch_title');
			actionStatus = data.activeStatus;
			if (data.activeStatus == "active") {
				accountSwitch.checked = true;
				account_switch_title.innerHTML = "Account Active : No action is needed";
			}
			else {
				accountSwitch.checked = false;
				account_switch_title.innerHTML = "Account Inactive : Action Needed";
				account_switch_title.style.color = 'red';
			}
			let txtNextBillDate = document.getElementById('nextBillDate');
			txtNextBillDate.innerText = "Next due payment: " + data.nextBillDate;
			// Call the function initially
			upgrade_time_for_conference();
			// // Update the greeting every minute (you can adjust the interval as needed)
			intervalId = setInterval(upgrade_time_for_conference, 1000);
			past_sessions = data.pastSeesions;
			let past_session_times = document.getElementsByClassName("past_session_time");
			let past_session_times_mobile = document.getElementsByClassName('past-session-related-time');
			let past_session_divs = document.getElementsByClassName('audio-open-modal-past');
			past_sessions.reverse();
			for (var i = 0; i < past_session_times.length; i++) {
				if (past_sessions.length <= i) {
					past_session_divs[i].setAttribute("style", "display:none;");
					past_session_divs[i + 5].setAttribute("style", "display:none;");
				}
				else {
					past_session_times[i].innerHTML = convert_time(past_sessions[i].savetime);
					past_session_times_mobile[i].innerHTML = convert_time(past_sessions[i].savetime);
				}
					
			}
			var show_yesterday = document.getElementById('show-date-yesterday');


			var today_t = new Date();
			var yesterday_t = new Date(today_t);
			yesterday_t.setDate(today_t.getDate() - 1);


			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			var formattedDate_yesterday = yesterday_t.getDate() + ' ' + months[yesterday_t.getMonth()] + ' ' + yesterday_t.getFullYear();
			//show_yesterday.innerHTML = `Yesterday - ${formattedDate_yesterday}`;
			show_yesterday.innerHTML = ``;

		} else if (data.status == 'failure') {
			alert('You are not permitted to reach this page.');
			window.location.href = '/payment';
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		window.location.href = '/payment';
	});
}
function addLeadingZero(number) {
	return number < 10 ? '0' + number : number.toString();
}
function upgrade_time_for_conference() {
	var currentTime = convert_local_time(new Date());
	var hours1 = currentTime.getHours();
	var minutes1 = currentTime.getMinutes();
	var seconds1 = currentTime.getSeconds();
	var timeString = hours1 + ':' + (minutes1 < 10 ? '0' : '') + minutes1;

	var greetingElement = document.getElementById('live_conference_title');
	var waiting_minutes = document.getElementById('live_conference_title_minutes');
	var imgElement = document.getElementById('live-session-img');

	var playingTimer = document.getElementById('live_session_playing_timer');
	// console.log("hours value " + hours);
	var isInRange =
		(timeString >= '5:00' && timeString <= '5:30') ||
		(timeString >= '8:00' && timeString <= '8:30') ||
		(timeString >= '12:00' && timeString <= '12:30') ||
		(timeString >= '16:00' && timeString <= '16:30') ||
		(timeString >= '19:00' && timeString <= '19:30');
	isInRange = !isExcludedDay(currentTime) & isInRange;

	if (isInRange) { //atlers here calcucate time and how musicplayer image
		var time_calc = 30 * 60 - minutes1 * 60 - seconds1;

		greetingElement.textContent = 'LIVE - Happening Now';
		playingTimer.innerHTML = `&#8987; ${addLeadingZero(parseInt(time_calc / 60))}: ${addLeadingZero(time_calc % 60)}`;
		waiting_minutes.textContent = "";
		imgElement.src = "/images/home/musicplayer.jpg";  // Replace with the actual path to your image
		if (time_calc == 0)
			window.location.reload();

	} else {
		var isExcludedDate = isExcludedDay(currentTime)? 1 : 0;
		var left_time;
		if (hours1 >= 5 && hours1 < 8) {
			left_time = 8 * 60 - hours1 * 60 - minutes1 + 21 * 60 * isExcludedDate;
			waiting_minutes.textContent = `Available In ${(parseInt(left_time / 60))} Hour(s) and ${addLeadingZero(left_time % 60)} Minute(s)`;
		}
		else if (hours1 >= 8 && hours1 < 12) {
			left_time = 12 * 60 - hours1 * 60 - minutes1 + 17 * 60 * isExcludedDate;
			waiting_minutes.textContent = `Available In ${(parseInt(left_time / 60))} Hour(s) and ${addLeadingZero(left_time % 60)} Minute(s)`;
		}
		else if (hours1 >= 12 && hours1 < 16) {
			left_time = 16 * 60 - hours1 * 60 - minutes1 + 13 * 60 * isExcludedDate;
			waiting_minutes.textContent = `Available In ${(parseInt(left_time / 60))} Hour(s) and ${addLeadingZero(left_time % 60)} Minute(s)`;
		}
		else if (hours1 >= 16 && hours1 < 19) {
			left_time = 19 * 60 - hours1 * 60 - minutes1 + 10 * 60 * isExcludedDate;
			waiting_minutes.textContent = `Available In ${(parseInt(left_time / 60))} Hour(s) and ${addLeadingZero(left_time % 60)} Minute(s)`;
		}
		else if (hours1 >= 19 && hours1 < 24) {
			left_time = 5 * 60 + 24 * 60 - hours1 * 60 - minutes1 + 0 * 60 * isExcludedDate;
			waiting_minutes.textContent = `Available In ${(parseInt(left_time / 60))} Hour(s) and ${addLeadingZero(left_time % 60)} Minute(s)`;
		}
		else {
			left_time = 5 * 60 - hours1 * 60 - minutes1 + 24 * 60 * isExcludedDate;
			waiting_minutes.textContent = `Available In ${(parseInt(left_time / 60))} Hour(s) and ${addLeadingZero(left_time % 60)} Minute(s)`;
		}

		greetingElement.textContent = 'Upcoming Session';
		imgElement.src = "/images/home/musicplayer_sandwatch.jpg";  // Replace with the actual path to your image
		// console.log("not in range....");
	}
}
function upgrage_sandwatch_pastsessions() {
	upgrade_timer_sandwatch_pastsessions();
	setInterval(upgrade_timer_sandwatch_pastsessions, 1000);
}
function upgrade_timer_sandwatch_pastsessions() {
	timestamp_past_session = timestamp_past_session + 1;
	var playingTimer = document.getElementById('live_session_playing_timer');
	var time_calc = 30 * 60 - timestamp_past_session;
	playingTimer.innerHTML = `&#8987; ${addLeadingZero(parseInt(time_calc / 60))}: ${addLeadingZero(time_calc % 60)}`;
}
function my_account() {
	const forenameInput = document.getElementById("forename");
	const surnameInput = document.getElementById("surname");
	const emailInput = document.getElementById("email");
	const validateButton = document.getElementById("validate");
	const currentPassword = document.getElementById("currentPassword");
	const newPassword = document.getElementById("newPassword");
	const confirmNewPassword = document.getElementById("confirmNewPassword");
	const changepasswordButton = document.getElementById("changepasswordButton");
	const token = localStorage.getItem('brh_root_token');
	const param = {
		"email": localStorage.getItem('brh_root_email'),
	};
	//fetch('https://api.brh.lcom:8443/rest-api/echoes/myaccount' 
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/myaccount'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {
			forenameInput.value = data.data.forename;
			surnameInput.value = data.data.surname;
			emailInput.value = data.data.email;
		} else if (data.status === "failed") {
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});

	var userModal = document.getElementById("changeUserInfoModal");
	var userConfirmModal = document.getElementById("confirmModal");

	var modal_Title = document.getElementById("procedure_title");
	var confirm_modal_Title = document.getElementById("procedure_confirm_title");
	// Get the buttons that opens the modal
	var yesUserBtn = document.getElementById("procedureYesBtn"); 
	var noUserBtn = document.getElementById("procedureNoBtn"); 
	var flag_Name_Password = 0;
	function showConfirmModal(){
		if(flag_Name_Password==1){
			confirm_modal_Title.textContent="Your name has been changed successfully!";
			const forename = forenameInput.value;
			const surname = surnameInput.value;
			const email = emailInput.value;

			const param = {
				"forename": forename,
				"surname": surname,
				"email": email,
			};

			const token = localStorage.getItem('brh_root_token');
			//fetch('https://api.brh.lcom:8443/rest-api/echoes/validateaccount'
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/validateaccount'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data);
				if (data.status === "success") {
					userConfirmModal.style.display = "block";
					flag_Name_Password = 0;
					setTimeout(function() {
						userConfirmModal.style.display = "none";
						localStorage.setItem('brh_root_username', data.data.surname + " " + data.data.forename);
						window.location.href = '/audio-conferencing-platform/my-account';
					}, 2000);
					
				} else if (data.status === "failed") {
				}
			}).catch(error => {
				console.error('There was a problem with the fetch operation:', error);
			});
		}
		else if(flag_Name_Password==2){
			confirm_modal_Title.textContent="Your password has been changed successfully!";
			const curpassword = currentPassword.value;
			const newpassword = newPassword.value;
			const confirmpassword = confirmNewPassword.value;
			if (newpassword != confirmpassword) {
				alert('Passwords do not match! Check again!');
				return;
			}
			const param = {
				"curpassword": curpassword,
				"newpassword": newpassword,
				"email": localStorage.getItem('brh_root_email'),
			};

			const token = localStorage.getItem('brh_root_token');
			//fetch('https://api.brh.lcom:8443/rest-api/echoes/changepassword',
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/changepassword') ,{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data);
				if (data.status === "success") {
					if(data.msg === "Wrong password!"){
						confirm_modal_Title.textContent="Something went wrong!";
					}
					userConfirmModal.style.display = "block";
					flag_Name_Password = 0;
					setTimeout(function() {
						userConfirmModal.style.display = "none";
					}, 2000);

			

				} else if (data.status === "failed") {
					 
					console.log("password is not right");
				}
			}).catch(error => {
				console.error('There was a problem with the fetch operation:', error);
			});

		}
		
	}
	function showUserModal(index) { 
		if(index==1)
		{
			flag_Name_Password = 1;
			modal_Title.textContent = "Are you sure you want to change your name?";
			
		}
		else if(index==2){
			flag_Name_Password = 2;
			modal_Title.textContent = "Are you sure you want to change your password?";
			
		}
		userModal.style.display = "block";
	}
	// When the user clicks on "Yes", close the modal and do something
	yesUserBtn.onclick = function () {
		userModal.style.display = "none"; 
		showConfirmModal();
	} 
	// When the user clicks on "Yes", close the modal and do something
	noUserBtn.onclick = function () {
		userModal.style.display = "none"; 
	} 

	validateButton.addEventListener("click", () => {
		  showUserModal(1);
	});
	changepasswordButton.addEventListener("click", () => {
		showUserModal(2);
	});
}

// function convert_time(serverTime) {
// 	// 	// Server time in EST
// 	// 	const serverTime = '2023-02-06T16:00:00-05:00'; // Assuming the server time is provided in ISO 8601 format with timezone offset

// 	// Convert server time to user's local time
// 	const localTime = new Date(serverTime);
// 	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// 	const userLocalTime = new Date(localTime.toLocaleString('en-US', { timeZone: userTimeZone }));

// 	// Format the local time
// 	const options = { month: 'short', day: 'numeric', hour: 'numeric', hour12: true };
// 	const formattedTime = userLocalTime.toLocaleString('en-US', options);

// 	console.log(formattedTime); // Output: Local time in user's time zone in the format "Feb 6, 2023, 4:00:00 PM"
// 	return formattedTime;
// }

// function convert_time(serverTime) {
// 	// Convert server time to user's local time
// 	const serverTimeZone = 'America/Denver';
// 	const localTime = new Date(serverTime);
// 	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// 	const userLocalTime = new Date(localTime.toLocaleString('en-US', { timeZone: serverTimeZone }));

// 	// Format the local time
// 	const options = { month: 'short', day: 'numeric', hour: 'numeric', hour12: true };
// 	const formattedTime = userLocalTime.toLocaleString('en-US', options);

// 	return formattedTime;
// }
function convert_upcoming_time(serverTimeStr) {
	var serverTime = new Date(serverTimeStr);

	// Get the local time zone offset in minutes
	var localTimezoneOffset = new Date().getTimezoneOffset();

	// Define Mountain time zone offset in minutes (7 hours behind UTC)
	var mountainTimezoneOffset = 7 * 60;

	// Calculate the difference between Mountain time zone offset and local time zone offset
	var offsetDifference = mountainTimezoneOffset - localTimezoneOffset;

	// Calculate the local time by adjusting the server time using the offset difference
	var localTime = new Date(serverTime.getTime() + (offsetDifference * 60000));

	return localTime;
}
function convert_local_time(localTimeStr) {

	// Get the local time zone offset in minutes
	var localTimezoneOffset = new Date().getTimezoneOffset();

	// Define Mountain time zone offset in minutes (7 hours behind UTC)
	var mountainTimezoneOffset = 7 * 60;

	// Calculate the difference between Mountain time zone offset and local time zone offset
	var offsetDifference = localTimezoneOffset - mountainTimezoneOffset;

	// Calculate the local time by adjusting the server time using the offset difference
	var localTime = new Date(new Date(localTimeStr).getTime() + (offsetDifference * 60000));

	return localTime;
}
function convert_time(serverTimeStr) {
	var serverTime = new Date(serverTimeStr);

	// Get the local time zone offset in minutes
	var localTimezoneOffset = new Date().getTimezoneOffset();

	// Define Mountain time zone offset in minutes (7 hours behind UTC)
	var mountainTimezoneOffset = 7 * 60;

	// Calculate the difference between Mountain time zone offset and local time zone offset
	var offsetDifference = mountainTimezoneOffset - localTimezoneOffset;

	// Calculate the local time by adjusting the server time using the offset difference
	var localTime = new Date(serverTime.getTime() + (offsetDifference * 60000));

	// Format the local time
	const options = { month: 'short', day: 'numeric', hour: 'numeric', hour12: true };
	const formattedTime = localTime.toLocaleString('en-US', options);

	return formattedTime;
}
function formatDateTime(argDate) {
	var serverTime = argDate;
	// Format the local time
	const options = { year: 'numeric', month: 'short', day: 'numeric' };
	const formattedTime = serverTime.toLocaleString('en-US', options);

	return formattedTime;
}
function affiliate_function() {


	var procedureModal = document.getElementById("DefaultAffiliateModal");
	// Get the buttons that opens the modal
	var yesBtn = document.getElementById("affiliateYesBtn"); 
	procedureModal.style.display = "none";
	function showAFModal() { 
		procedureModal.style.display = "block";
	}
	// When the user clicks on "Yes", close the modal and do something
	yesBtn.onclick = function () {
		procedureModal.style.display = "none"; 

	} 


	const loginButton = document.getElementById("login_button");
	const signupButton = document.getElementById("signup_button");

	



	loginButton.addEventListener("click", () => {
		const username = document.getElementById("loginName").value;
		const password = document.getElementById("loginPassword").value;

		const param = {
			"email": username,
			"password": password,
		};


		var validate_erro_flag = 0;
		const username_validator=document.getElementById("loginName").value.trim();
			// Email validation regular expression
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			// Check if email is valid
			if (!emailRegex.test(username_validator)) {
				// Display error message
				
				document.getElementById("login_email_validate_text").style.display="block";
				validate_erro_flag = 1;
			}  
			else{
				document.getElementById("login_email_validate_text").style.display="none";
			}
			if(password === ''){
				document.getElementById("login_password_validate_text").style.display="block";
				validate_erro_flag = 1;
			}else{
				document.getElementById("login_password_validate_text").style.display="none";
	
			}
			if(username == "admin@gmail.com"){
				showAFModal();
				validate_erro_flag = 1;
			}

			if(validate_erro_flag==0)
			{

		//fetch('https://api.brh.lcom:8443/rest-api/echoes/affiliatesignin'
		fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/affiliatesignin'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(param),
		}).then(response => {
			console.log("response>>>", response);
			return response.json();
		}).then(data => {
			console.log("data>>>>", data);
			if (data.status === "success") {
				localStorage.setItem('brh_affiliate_root_email', username);
				window.location.href = '/affiliate-dashboard';
			} else if (data.status === "failed") {
				showAFModal();
			} else{
				showAFModal();
			}
		}).catch(error => {
			showAFModal();
			console.error('There was a problem with the fetch operation:', error);
		});

	}
	});
	signupButton.addEventListener("click", () => {
		const surname = document.getElementById("registerName").value;
		const forename = document.getElementById("registerUsername").value;
		const email = document.getElementById("registerEmail").value;
		const password = document.getElementById("registerPassword").value;
		const repassword = document.getElementById("registerRepeatPassword").value;

		const param = {
			"firstname": surname,
			"lastname": forename,
			"email": email,
			"password": password,
		};


		var validate_erro_flag = 0;
		// Retrieve email value
		const email_validator= document.getElementById("registerEmail").value.trim();

		// Email validation regular expression
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		 // Check if email is valid
		 if (!emailRegex.test(email_validator)) {
			// Display error message
			document.getElementById("signup_email_validate_text").style.display="block";
			 
			validate_erro_flag = 1;
		}  
		else{
			document.getElementById("signup_email_validate_text").style.display="none";
		}

		// Regular expression for alphabetic characters
		const alphaRegex = /^[a-zA-Z]+$/;

		const firstname_validator = document.getElementById("registerName").value.trim();
		const lastname_validator = document.getElementById("registerUsername").value.trim();

		// Check if first name contains only alphabetic characters
		if (firstname_validator === '' || !alphaRegex.test(firstname_validator)) {
			// Reset placeholder
		 	document.getElementById("signup_firstname_validate_text").style.display="block";

			validate_erro_flag=1;
		} else{
			document.getElementById("signup_firstname_validate_text").style.display="none";

		}
		// Check if first name contains only alphabetic characters
		if (lastname_validator === '' || !alphaRegex.test(lastname_validator)) {
			// Display error message  
			document.getElementById("signup_lastname_validate_text").style.display="block";
			validate_erro_flag=1;
		}else{
			document.getElementById("signup_lastname_validate_text").style.display="none";

		}

		if((password != repassword) || password === '' || repassword === ''){
			document.getElementById("registerRepeatPassword").value="";
			document.getElementById("registerPassword").value=""; 
			
			document.getElementById("signup_password_validate_text").style.display="block";
			document.getElementById("signup_repassword_validate_text").style.display="block";

			validate_erro_flag=1;
		}else{
			document.getElementById("signup_password_validate_text").style.display="none";
			document.getElementById("signup_repassword_validate_text").style.display="none";
		}



		if(validate_erro_flag == 0)
		{

		//fetch('https://api.brh.lcom:8443/rest-api/echoes/affiliatesignup'
		
		
		fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/affiliatesignup'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(param),
		}).then(response => {
			console.log("response>>>", response);
			return response.json();
		}).then(data => {
			console.log("data>>>>", data);
			if (data.status === "success") {
				localStorage.setItem('brh_affiliate_root_email', email);
				window.location.href = '/affiliate-dashboard';
			} else if (data.status === "failed") {
			}
		}).catch(error => {
			console.error('There was a problem with the fetch operation:', error);
		});

		}
	});
}
function affiliate_dashboard_function() {
	const email = localStorage.getItem('brh_affiliate_root_email');
	const param = {
		"username": email,
	};
	//fetch('https://api.brh.lcom:8443/rest-api/user/referral-code', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/referral-code'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {
			const referral = document.getElementById('referr_code');
			referral.innerHTML = `${window.location.protocol}//${window.location.host}/join-session/${data.msg}`;
			const general_revenue_txt = document.getElementById('general_revenue_txt');
			general_revenue_txt.innerHTML = '$' + data.generatedRevenue;
			
			const self_revenue_txt = document.getElementById('self_revenue_txt');
			
			let truncatedNum = Math.floor(data.generatedRevenue * 0.3 * 100) / 100;
			self_revenue_txt.innerHTML = '$' + truncatedNum;

			const subscribed_users_txt = document.getElementById('subscribed_users_txt');
			subscribed_users_txt.innerHTML = data.subscribledCount;
 


		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function home_function() {
	var userModal = document.getElementById("ContactDefaultModal");
	var yesUserBtn = document.getElementById("contactprocedureYesBtn"); 
	// When the user clicks on "Yes", close the modal and do something
	yesUserBtn.onclick = function () {
		userModal.style.display = "none"; 
	} 

	function show_contactSuccessModal(){

		userModal.style.display = "block";
	}

	var btn_open = document.querySelector('.btn-menu');
	var menu = document.querySelector('.menu');

	btn_open.addEventListener('click', function () {
		if (btn_open.classList.contains('close')) {
			btn_open.classList.remove('close')
			menu.classList.remove('show')
		} else {
			btn_open.classList.add('close')
			menu.classList.add('show')
		}
	})
	document.querySelector('.menu').addEventListener('click', function (event) {
		if (event.target.tagName.toLowerCase() === 'a') {
			btn_open.classList.remove('close')
			menu.classList.remove('show')
		}
	})

	const slidesContainer = document.getElementById("slides-container");
	const slide = document.querySelector(".slide");
	const prevButton = document.getElementById("slide-arrow-prev");
	const nextButton = document.getElementById("slide-arrow-next");

	nextButton.addEventListener("click", () => {
		const slideWidth = slide.clientWidth;
		slidesContainer.scrollLeft += slideWidth;
	});

	prevButton.addEventListener("click", () => {
		const slideWidth = slide.clientWidth;
		slidesContainer.scrollLeft -= slideWidth;
	});
	const service1 = document.getElementById("service1");
	const des1 = document.getElementById("des1");
	const service2 = document.getElementById("service2");
	const des2 = document.getElementById("des2");
	const service3 = document.getElementById("service3");
	const des3 = document.getElementById("des3");
	const service4 = document.getElementById("service4");
	const des4 = document.getElementById("des4");

	const param = {
	};

	//fetch('https://api.brh.lcom:8443/rest-api/echoes/servicelist'
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/servicelist'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {
			service1.innerText = data.data[0].title;
			des1.innerText = data.data[0].description;
			service2.innerText = data.data[1].title;
			des2.innerText = data.data[1].description;
			service3.innerText = data.data[2].title;
			des3.innerText = data.data[2].description;
			service4.innerText = data.data[3].title;
			des4.innerText = data.data[3].description;
		} else if (data.status === "failed") {
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});

	const firstname = document.getElementById("firstname");
		const lastname = document.getElementById("lastname");
		const email = document.getElementById("email");
		const message = document.getElementById("message");

	const submit = document.getElementById("submit");
	submit.addEventListener("click", () => {
		var validate_erro_flag = 0;
		
		console.log("validate error flag = " , validate_erro_flag);
		// Retrieve email value
		const email_validator = email.value.trim();

		// Email validation regular expression
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		 // Check if email is valid
		 if (!emailRegex.test(email_validator)) {
			// Display error message
			email.placeholder = "Please insert your contact Email"; 
			document.getElementById("email_validate_text").style.display="block";
			validate_erro_flag = 1;
		}  
		else{
			
			document.getElementById("email_validate_text").style.display="none";
		}
		// Regular expression for alphabetic characters
		const alphaRegex = /^[a-zA-Z]+$/;

		const firstname_validator = firstname.value.trim();
		const lastname_validator = lastname.value.trim();
		const message_validator = message.value.trim();

		// Check if first name contains only alphabetic characters
	 	if (firstname_validator === '' || !alphaRegex.test(firstname_validator)) {
			// Reset placeholder
			firstname.placeholder = "First Name"; 
			firstname.value ="";
			document.getElementById("firstname_validate_text").style.display="block";
			validate_erro_flag=1;
		} 
		else{
			
			document.getElementById("firstname_validate_text").style.display="none";
		}
		// Check if first name contains only alphabetic characters
		if (lastname_validator === '' || !alphaRegex.test(lastname_validator)) {
			// Display error message  
			lastname.placeholder = "Last Name"; 
			lastname.value="";
			document.getElementById("lastname_validate_text").style.display="block";
			validate_erro_flag=1;
			
		}
		else{
			
			document.getElementById("lastname_validate_text").style.display="none";
		}

		// Check if first name contains only alphabetic characters
		if (message_validator === '') {
			// Display error message  
			message.placeholder = "Write a message here!";  
			message.value= "";
			document.getElementById("message_validate_text").style.display="block";
			validate_erro_flag=1;
		}
		else{

			document.getElementById("message_validate_text").style.display="none";
		}





		const submit_param = {
			"firstname": firstname.value,
			"lastname": lastname.value,
			"email": email.value,
			"message": message.value,
		};
		
		if(validate_erro_flag==0)
		{
			//fetch('https://api.brh.lcom:8443/rest-api/echoes/contactus'
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/contactus'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(submit_param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data); 
				if (data.status === "success") {
					show_contactSuccessModal();
				} else if (data.status === "failed") {
				}
			}).catch(error => {
				console.error('There was a problem with the fetch operation:', error);
			});
		}
	


	});

	document.addEventListener('DOMContentLoaded');

}

  
function showDefaultModal(messageText, modalHandler = null) { 
	var procedureModal = document.getElementById('DefaultModal');
	var errorTitle1 = document.getElementById('procedure_title');
	errorTitle1.textContent = messageText;
	procedureModal.style.display = "block";
	var yesBtn = document.getElementById("procedureYesBtn"); 
	yesBtn.onclick = function () {
		procedureModal.style.display = "none"; 
		if (modalHandler != null)
			modalHandler();
	}
}
function login_function(referral_code) {
	if (referral_code != '') {
		document.querySelector('a.btn.btn-back').setAttribute('style', 'display:none');
		document.querySelector('#tab-register').click();
		document.querySelector('#tab-login').setAttribute('style', 'display:none');
	}
	// check if referral_code is real code or invite link
	if (referral_code.indexOf('invite/') != -1) {
		var parts = referral_code.split('/');
		// Extract the last part of the URL
		var invite_token = parts[parts.length - 1];
		const param = {
			"token": invite_token,
		};
		referral_code = '';
		//fetch('https://api.brh.lcom:8443/rest-api/user/validate-invite-token', 
		fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/validate-invite-token'),{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data);
				if (data.activeStatus == 'active') {
					inviteToken = invite_token;
				}else  {
					window.location.href = "/home";
				}
			}).catch(error => {
				showDefaultModal("Username or password is incorrect.");
				console.error('There was a problem with the fetch operation:', error);
	 
			});
	}
	var procedureModal = document.getElementById("DefaultModal");
	// Get the buttons that opens the modal
	var yesBtn = document.getElementById("procedureYesBtn"); 
	// When the user clicks on "Yes", close the modal and do something
	yesBtn.onclick = function () {
		procedureModal.style.display = "none"; 

	} 
	const loginButton = document.getElementById("login-button");
	const signupButton = document.getElementById("signup-button");
	loginButton.addEventListener("click", () => {
		const username = document.getElementById("loginName").value;
		const password = document.getElementById("loginPassword").value;
		const param = {
			"username": username,
			"password": password,
		};
		var validate_erro_flag = 0;
		const username_validator=document.getElementById("loginName").value.trim();
		// Email validation regular expression
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		// Check if email is valid
		if (!emailRegex.test(username_validator)) {
			// Display error message
			
			document.getElementById("login_email_validate_text").style.display="block";
			validate_erro_flag = 1;
		}  
		else{
			document.getElementById("login_email_validate_text").style.display="none";
		}
		if(password === ''){
			document.getElementById("login_password_validate_text").style.display="block";
			validate_erro_flag = 1;
		}else{
			document.getElementById("login_password_validate_text").style.display="none";

		}
		if(username == "admin@gmail.com"){
			showDefaultModal("Username or password is incorrect.");
			validate_erro_flag = 1;
		}
		if(validate_erro_flag==0)
		{
			//fetch('https://api.brh.lcom:8443/rest-api/echoes/signin'
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/signin'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data);
				if (data.status === "success") {
					localStorage.setItem('brh_root_token', data.msg);
					localStorage.setItem('brh_root_email', username);
					localStorage.setItem('brh_root_username', data.data.surname + " " + data.data.forename);
					if (data.user_status == "active")
						window.location.href = '/audio-conferencing-platform';
					else window.location.href = '/subscription';
				} else if (data.status === "failed") {
					showDefaultModal(data.msg);
				}
			}).catch(error => {
				showDefaultModal("Username or password is incorrect.");
				console.error('There was a problem with the fetch operation:', error);
	 
			});
		}
	



	});
	signupButton.addEventListener("click", () => {
		 
 
		const surname = document.getElementById("registerName").value;
		const forename = document.getElementById("registerUsername").value;
		const email = document.getElementById("registerEmail").value;
		const password = document.getElementById("registerPassword").value;
		const repassword = document.getElementById("registerRepeatPassword").value;

		const param = {
			"surname": surname,
			"forename": forename,
			"username": surname,
			"email": email,
			"password": password,
			'refer_code': referral_code,
			'inviteToken': inviteToken
		};

		var validate_erro_flag = 0;
		// Retrieve email value
		const email_validator= document.getElementById("registerEmail").value.trim();

		// Email validation regular expression
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		 // Check if email is valid
		 if (!emailRegex.test(email_validator)) {
			// Display error message
			document.getElementById("signup_email_validate_text").style.display="block";
			 
			validate_erro_flag = 1;
		}  
		else{
			document.getElementById("signup_email_validate_text").style.display="none";
		}

		// Regular expression for alphabetic characters
		const alphaRegex = /^[a-zA-Z]+$/;

		const firstname_validator = document.getElementById("registerName").value.trim();
		const lastname_validator = document.getElementById("registerUsername").value.trim();

		// Check if first name contains only alphabetic characters
		if (firstname_validator === '' || !alphaRegex.test(firstname_validator)) {
			// Reset placeholder
		 	document.getElementById("signup_firstname_validate_text").style.display="block";

			validate_erro_flag=1;
		} else{
			document.getElementById("signup_firstname_validate_text").style.display="none";

		}
		// Check if first name contains only alphabetic characters
		if (lastname_validator === '' || !alphaRegex.test(lastname_validator)) {
			// Display error message  
			document.getElementById("signup_lastname_validate_text").style.display="block";
			validate_erro_flag=1;
		}else{
			document.getElementById("signup_lastname_validate_text").style.display="none";

		}

		if((password != repassword) || password === '' || repassword === ''){
			document.getElementById("registerRepeatPassword").value="";
			document.getElementById("registerPassword").value=""; 
			
			document.getElementById("signup_password_validate_text").style.display="block";
			document.getElementById("signup_repassword_validate_text").style.display="block";

			validate_erro_flag=1;
		}else{
			document.getElementById("signup_password_validate_text").style.display="none";
			document.getElementById("signup_repassword_validate_text").style.display="none";
		}

		if(validate_erro_flag == 0)
		{
			//fetch('https://api.brh.lcom:8443/rest-api/echoes/signup'
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/echoes/signup'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data);
				if (data.status === "success") {
					localStorage.setItem('brh_root_token', data.msg);
					localStorage.setItem('brh_root_email', email);
					localStorage.setItem('brh_root_username', data.data.surname + " " + data.data.forename);
					if (inviteToken != '')
						window.location.href = '/audio-conferencing-platform';
					else 
						window.location.href = '/subscription';
				} else if (data.status === "failed") {
					showDefaultModal(data.msg);
				}
			}).catch(error => {
				console.error('There was a problem with the fetch operation:', error);
			});
		}

	



	});

}


document.addEventListener('DOMContentLoaded', init)

function init() {


	document.querySelector('#main-content').addEventListener('click', function (event) {
		if (event.target.classList.contains('login-tab-nav')) {
			var tabId = event.target.getAttribute('data-id');
			console.log('tabId', tabId)
			if (tabId === 'pills-forgotpassword') {
				const nav_iteme = document.getElementById('ex1');
				nav_iteme.style.display = 'none';

			}
			else {
				const nav_iteme = document.getElementById('ex1');
				nav_iteme.style.display = 'flex';
			}

			// Hide all tabs
			const tabs = document.querySelectorAll('.tab-pane');
			tabs.forEach(tab => {
				tab.classList.remove('show', 'active');
			});

			// Show the selected tab
			const selectedTab = document.getElementById(tabId);
			selectedTab.classList.add('show', 'active');

			// Hide all tabs
			const tab_btns = document.querySelectorAll('.login-tab-nav');
			tab_btns.forEach(tab => {
				tab.classList.remove('active');
			});

			const parentEl = event.target.classList.add('active');
		}
		if (event.target.classList.contains('btn-open-modal')) {			
			const modal_view = document.querySelector('#recoverAlert');
			var pay_load = {
				"email": document.getElementById('forgotEmail').value
			};
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/forgot-password'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(pay_load)
			})
			.then(response => response.json())
			.then(data => {
				if (data.status == 'success'){
					modal_view.style.display = 'flex';
				}
				else showDefaultModal("Failed! Try again.");		
			})
			.catch(error => console.error('Error:', error))
		}
		if (event.target.classList.contains('btn-close-modal')) {
			const modal_view = document.querySelector('#recoverAlert');
			modal_view.style.display = 'none';;
		}
		if (event.target.classList.contains('audio-preview-img')) {
			const time_for_conference = document.getElementById('live_conference_title');
			if (time_for_conference.textContent === 'LIVE - Happening Now') {
				// Audio player initializing for conference call
				if (socket != undefined && socket.readyState === WebSocket.OPEN)
					socket.close();
				if (!checkAccountAciveConference())
					return;
				//initAudioPlayer(-1); //atlers0
				const modal_view = document.querySelector('#musicplayer');
				const modal_preview = document.querySelector('#audio-preview');
				modal_view.style.display = 'block';
				modal_preview.style.display = 'none';
				
					const script = document.createElement('script');
			script.src = './scripts/streams/audio_playback.js';
			script.type = 'module';
			document.body.appendChild(script)
			
				if (window.innerWidth < 425) {
					window.scrollTo(0, window.scrollY + 230);
				} else {
					window.scrollTo(0, 0);
				}

			}
		}

		/* MODAL FOR CONFERENCE PAST SESSIONS */




		if (event.target.classList.contains('audio-past-session-1')) {

			// const modal_view = document.querySelector('#musicplayer');
			// const modal_preview = document.querySelector('#audio-preview');
			// Audio player initializing for conference call
			timestamp_past_session = 0;

			// upgrage_sandwatch_pastsessions();
			if (socket != undefined && socket.readyState === WebSocket.OPEN)
				socket.close();
				
			if (!checkAccountAciveConference())
				return;
			initAudioPlayer(0);
			// modal_view.style.display = 'block';
			// modal_preview.style.display = 'none';
			document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
			document.getElementById('past_savetime_txt').innerText = convert_time(past_sessions[0].savetime);
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClock, 1000);
			var targetModalElement = document.getElementById('past-session-modal');
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			// if (window.innerWidth < 425) {
			// 	window.scrollTo(0, window.scrollY + 230);
			// } else {
			// 	window.scrollTo(0, 0);
			// }
		}

		if (event.target.classList.contains('audio-past-session-2')) {

			// const modal_view = document.querySelector('#musicplayer');
			// const modal_preview = document.querySelector('#audio-preview');
			// Audio player initializing for conference call
			timestamp_past_session = 0;

			// upgrage_sandwatch_pastsessions();
			if (socket != undefined && socket.readyState === WebSocket.OPEN)
				socket.close();
			if (!checkAccountAciveConference())
				return;
			initAudioPlayer(1);
			document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
			document.getElementById('past_savetime_txt').innerText = convert_time(past_sessions[1].savetime);
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClock, 1000);
			var targetModalElement = document.getElementById('past-session-modal');
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			// modal_view.style.display = 'block';
			// modal_preview.style.display = 'none';
			// if (window.innerWidth < 425) {
			// 	window.scrollTo(0, window.scrollY + 230);
			// } else {
			// 	window.scrollTo(0, 0);
			// }
		}

		if (event.target.classList.contains('audio-past-session-3')) {

			// const modal_view = document.querySelector('#musicplayer');
			// const modal_preview = document.querySelector('#audio-preview');
			// Audio player initializing for conference call
			timestamp_past_session = 0;
			// upgrage_sandwatch_pastsessions();
			if (socket != undefined && socket.readyState === WebSocket.OPEN)
				socket.close();
				
			if (!checkAccountAciveConference())
				return;
			initAudioPlayer(2);
			document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
			document.getElementById('past_savetime_txt').innerText = convert_time(past_sessions[2].savetime);
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClock, 1000);
			var targetModalElement = document.getElementById('past-session-modal');
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			// modal_view.style.display = 'block';
			// modal_preview.style.display = 'none';
			// if (window.innerWidth < 425) {
			// 	window.scrollTo(0, window.scrollY + 230);
			// } else {
			// 	window.scrollTo(0, 0);
			// }
		}
		if (event.target.classList.contains('audio-past-session-4')) {

			// const modal_view = document.querySelector('#musicplayer');
			// const modal_preview = document.querySelector('#audio-preview');
			// Audio player initializing for conference call
			timestamp_past_session = 0;

			// upgrage_sandwatch_pastsessions();
			if (socket != undefined && socket.readyState === WebSocket.OPEN)
				socket.close();
				
			if (!checkAccountAciveConference())
				return;
			initAudioPlayer(3);
			document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
			document.getElementById('past_savetime_txt').innerText = convert_time(past_sessions[3].savetime);
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClock, 1000);
			var targetModalElement = document.getElementById('past-session-modal');
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			// modal_view.style.display = 'block';
			// modal_preview.style.display = 'none';
			// if (window.innerWidth < 425) {
			// 	window.scrollTo(0, window.scrollY + 230);
			// } else {
			// 	window.scrollTo(0, 0);
			// }
		}

		if (event.target.classList.contains('audio-past-session-5')) {

			// const modal_view = document.querySelector('#musicplayer');
			// const modal_preview = document.querySelector('#audio-preview');
			// Audio player initializing for conference call
			timestamp_past_session = 0;

			// upgrage_sandwatch_pastsessions();
			if (socket != undefined && socket.readyState === WebSocket.OPEN)
				socket.close();
				
			if (!checkAccountAciveConference())
				return;
			initAudioPlayer(4);
			document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
			document.getElementById('past_savetime_txt').innerText = convert_time(past_sessions[4].savetime);
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClock, 1000);
			var targetModalElement = document.getElementById('past-session-modal');
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			// modal_view.style.display = 'block';
			// modal_preview.style.display = 'none';
			// if (window.innerWidth < 425) {
			// 	window.scrollTo(0, window.scrollY + 230);
			// }
			// else {
			// 	window.scrollTo(0, 0);
			// }
		}



		if (event.target.classList.contains('affiliate-login-tab-nav')) {
			var tabId = event.target.getAttribute('data-id');
			console.log('tabId', tabId)
			if (tabId === 'pills-forgotpassword') {
				const nav_iteme = document.getElementById('ex1');
				nav_iteme.style.display = 'none';

			}
			else {
				const nav_iteme = document.getElementById('ex1');
				nav_iteme.style.display = 'flex';
			}

			// Hide all tabs
			const tabs = document.querySelectorAll('.affiliate-tab-pane');
			tabs.forEach(tab => {
				tab.classList.remove('show', 'active');
			});

			// Show the selected tab
			const selectedTab = document.getElementById(tabId);
			selectedTab.classList.add('show', 'active');

			// Hide all tabs
			const tab_btns = document.querySelectorAll('.affiliate-login-tab-nav');
			tab_btns.forEach(tab => {
				tab.classList.remove('active');
			});

			const parentEl = event.target.classList.add('active');
		}
		if (event.target.classList.contains('affiliate-btn-open-modal')) {
			const modal_view = document.querySelector('#recoverAlert');
			var pay_load = {
				"email": document.getElementById('forgotEmail').value
			};
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/user/affiliate-forgot-password'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(pay_load)
			})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				if (data.status == 'success'){
					modal_view.style.display = 'flex';
				}
				else showDefaultModal("Failed! Try again.");		
			})
			.catch(error => console.error('Error:', error))

		}
		if (event.target.classList.contains('btn-close-modal')) {
			const modal_view = document.querySelector('#affiliaterecoverAlert');
			modal_view.style.display = 'none';

		}
		if (event.target.classList.contains('full-screen')) {
			var elem = document.getElementById('musicplayer');
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				elem.requestFullscreen();
			}
		}

	})
	document.querySelector('#header-content').addEventListener('click', function (event) {



		if (event.target.classList.contains('link')) {
			let target = null
			if (event.target.matches('a.link')) target = event.target.dataset.target

			if (!target) return

			event.preventDefault()

			var element = document.getElementById(target)

			let position = element.getBoundingClientRect();

			if (window.innerWidth > 425) {
				window.scrollTo(position.left, position.top + window.scrollY - 86);
			}
			if (window.innerWidth < 425) {
				window.scrollTo(position.left, position.top + window.scrollY - 86);
			}
		}
	})

}
function updateTime() {
	var currentTime = new Date();
	var hours1 = currentTime.getHours();
	var minutes1 = currentTime.getMinutes();
	var seconds1 = currentTime.getSeconds();

	// Format the time as HH:MM:SS
	var formattedTime = hours1 + ":" + (minutes1 < 10 ? "0" : "") + minutes1 + ":" + (seconds1 < 10 ? "0" : "") + seconds1;

	// Display the time in the dropdown content
	if (document.getElementById("timeContainer")) document.getElementById("timeContainer").innerHTML = "<br/><p> Current Time : " + formattedTime + "</p>";
}

// Update the time every second
setInterval(updateTime, 1000);

// Run updateTime initially to display the time immediately
updateTime();

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker
			.register("/scripts/serviceWorker.js")
			.then(res => console.log("service worker registered"))
			.catch(err => console.log("service worker not registered", err));
	});
}


