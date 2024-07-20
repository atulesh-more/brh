import VanillaRouter from './router.js'
import {
	h
} from "https://unpkg.com/gridjs?module";
function switchToSubdomain(url, subdomain, path) {
	return `${window.location.protocol}//${window.location.host.replace(/^([^.])*/, subdomain)}/${path}`;
}	
function switchToSubdomainWSS(url, subdomain, path) {
	return `${'wss:'}//${subdomain + '.' + window.location.host.replace('admin.', '')}/${path}`;
}	
const router = new VanillaRouter({
	type: 'history',
	routes: {
		'/': 'admin_login',

		'/dashboard': 'admin_dashboard',
		'/streaming': 'admin_manage_session',
		'/users': 'admin_user_management',
		'/affiliate': 'admin_user_affiliate_management',


		'/subscription': 'subscription',

	},
})

var fileList;
var intervalID, intervalID1;
var intervalPlayer = null;
var initial_seconds_variable = 0;
var is_muted = false;
let socket;
let recordedChunks = [];
let mediaRecorder;
let adminAudioStream = new MediaStream();
var page_index = 0;
var close_session_modal_btn;

var audioContext;
let mediaSource;
let analyser;
let canvas;
audioContext = new (window.AudioContext || window.webkitAudioContext)();
//play the live session based on the time.....

var current_playing_session = '0';

router.listen().on('route', async (e) => {
	///////////////
	const token = localStorage.getItem('brh_admin_token');
	let isValidToken = false;
	if (e.detail.route != '' && e.detail.route != 'admin_login') {
		const response = await fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/validate-token'),{//fetch('https://api.brh.lcom:8443/rest-api/admin/validate-token', {
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
	if (isValidToken) {
		window.location.href = "/";
		return;
	}
	document.getElementById('header-content').classList.add('hidden');
	window.scrollTo({ top: 0, behavior: 'smooth' })
	if (e.detail.route === "home") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/home_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "login") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/login_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})

	} else if (e.detail.route === "admin_login") {
		localStorage.removeItem('brh_admin_token');
		localStorage.removeItem('brh_admin_email');
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/admin_login_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "admin_dashboard") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/admin_dashboard_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "admin_manage_session") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/admin_dashboard_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "admin_user_management") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/admin_dashboard_header.html').then((response) => response.text()).then((htmlData) => {
			document.getElementById('header-content').innerHTML = htmlData;
		})
	} else if (e.detail.route === "admin_user_affiliate_management") {
		document.getElementById('header-content').classList.remove('hidden');
		fetch('pages/header/admin_dashboard_header.html').then((response) => response.text()).then((htmlData) => {
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

	fetch('pages/' + e.detail.route + '.html').then((response) => response.text()).then((htmlData) => {
		document.getElementById('main-content').innerHTML = htmlData
		document.querySelectorAll('.menu ul li a').forEach(function (elem) {
			if (elem.href.endsWith(e.detail.route) || (elem.href.endsWith("/") && e.detail.route == 'main')) {
				elem.parentElement.classList.add('active')
			} else {
				elem.parentElement.classList.remove('active');
			}
		});
		if (e.detail.route === 'admin_login') {
			clearInterval(intervalID1);
			admin_login_function();
			page_index = 1;
		}

		if (e.detail.route === "admin_dashboard") {
			clearInterval(intervalID1);
			intervalID1 = setInterval(updateTime, 1000);
			dashboard_function();
			home_function();
			page_index = 2;
		}

		if (e.detail.route === "admin_user_management") {
			clearInterval(intervalID1);
			intervalID1 = setInterval(updateTime, 1000);
			admin_user_management_function();
			home_function();
			page_index = 3;
		}
		if (e.detail.route === "admin_user_affiliate_management") {
			clearInterval(intervalID1);
			intervalID1 = setInterval(updateTime, 1000);
			admin_user_affiliate_management_function();
			home_function();
			page_index = 4;
		}

		if (e.detail.route === "admin_manage_session") {

			// Update the time every second
			//******************* */
			clearInterval(intervalID1);
			intervalID1 = setInterval(updateTime, 1000);
			// Run updateTime initially to display the time immediately
			const joinBtn = document.getElementById('startSpeaking');
			const cancelBtn = document.getElementById('stopSpeaking');
			joinBtn.addEventListener("click", () => {
				initSocket(); 
				joinBtn.disabled = true;
				cancelBtn.disabled = false;
			});
			session_manage_function();
			home_function();
			home_upcoming_session_showing_function();
			
			page_index = 5;
		}

	}).catch(err => { })
})


function initCanvas(audioElementId, video_type) {

	canvas = document.getElementById('canvas_visualization');
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

function isExcludedDay(date) {
	const dayOfWeek = date.getDay();
	return dayOfWeek === 0 || dayOfWeek === 3; // 0 is Sunday, 3 is Wednesday
}

function initSocket(video_types) {

	//const SIGNALING_SERVER_URL = 'wss://api.brh.lcom:8443/stream/user/';

	const SIGNALING_SERVER_URL = switchToSubdomainWSS(window.location.href,'api','stream/user/');

	
	var userEmail = localStorage.getItem('brh_admin_email');
	// admin.js
	
	if (video_types >= 0)
		socket = new WebSocket(SIGNALING_SERVER_URL + 'listener/' + userEmail);
	else {
		socket = new WebSocket(SIGNALING_SERVER_URL + 'admin/' + userEmail);
		startAudioCapture();
	}
	const userAudio = document.getElementById('adminAudio');
	const userListDiv = document.getElementById('userList');
	const peers = {};
	let sId;

	const joinBtn = document.getElementById('startSpeaking');
	const cancelBtn = document.getElementById('stopSpeaking');
	joinBtn.addEventListener("click", () => {
		initSocket(-1);
		joinBtn.disabled = true;
		cancelBtn.disabled = false;
	});
	cancelBtn.addEventListener("click", () => {
		joinBtn.disabled = false;
		cancelBtn.disabled = true;
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			// Stop recording
			mediaRecorder.stop();
			console.log('Recording stopped');
		}
		recordedChunks = [];
	});

	function stopMediaStream() {
		if (adminAudioStream) {
			adminAudioStream.getTracks().forEach(track => track.stop());
		}
	}

	function sendBlobData(data) {
		console.log(data, 'recordedChunks');
		socket.send(data);
		// socket.close();
	}

	var pingInterval = 30000;
	// Set a variable to store the ping message
	var pingMessage = "ping";
	// Set a variable to store the ping timer ID
	var pingTimer = null;
	// Define a function to send a ping message to the server

	function sendPing() {
		// Send the ping message as a text frame
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

	socket.onopen = () => {
		console.log('Connected to signaling server as admin');
		startPing();
	};

	socket.onmessage = (event) => {
		if (event.data instanceof Blob) {
			const blobUrl = URL.createObjectURL(event.data);
			const audioElement = document.getElementById('adminAudio');
			audioElement.muted = false;
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
			initCanvas('adminAudio', video_types);
			return;
		}
		if (event.data == "ping")
			return;
		const data = JSON.parse(event.data);

		console.log("onmessage", data);
		switch (data.type) {
			case 'login':
				sId = data.data;
				console.log("my id is " + sId);
				break;
			case 'new-user':
				handleNewUser(data.data);
				break;
			case 'user-disconnected':
				handleUserDisconnected(data.data);
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
		}
	};

	socket.onclose = () => {
		stopPing();
		console.log('Disconnected from signaling server');
	};

	socket.onerror = (error) => {
		console.error('WebSocket error: ', error);
	};

	function handleNewUser(userId) {
		console.log('handling new user in admin.js');
		const userAudioElement = document.createElement('audio');
		userAudioElement.id = userId;
		userAudioElement.controls = true;
		userAudioElement.muted = true;
		userListDiv.appendChild(userAudioElement);

		createPeerConnection(userId);
	}

	function handleUserDisconnected(userId) {
		const userAudioElement = document.getElementById(userId);
		if (userAudioElement) {
			userListDiv.removeChild(userAudioElement);
		}
		const peerConnection = peers[userId];
		if (peerConnection) {
			peerConnection.close();
			delete peers[userId];
		}
	}

	function createPeerConnection(userId) {
		console.log('creating peerconnection in admin.js');
		const peerConnection = new RTCPeerConnection();
		peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				console.log('sending ice-candidate in admin.js')
				socket.send(JSON.stringify({
					type: 'ice-candidate',
					data: {
						target: userId,
						candidate: event.candidate,
						sender: sId
					},
				}));
			}
		};
		// peerConnection.addStream(adminAudioStream);
		adminAudioStream.getTracks().forEach(track => {
			peerConnection.addTrack(track, adminAudioStream);
		});
		peerConnection.createOffer()
			.then(offer => peerConnection.setLocalDescription(offer))
			.then(() => {
				console.log('create off in admin .js')
				socket.send(JSON.stringify({
					type: 'offer',
					data: {
						target: userId,
						offer: peerConnection.localDescription,
						sender: sId
					},
				}));
			});
		peers[userId] = peerConnection;
		return;
	}

	function handleOffer(data) {
		console.log('handling offer in admin.js', data.sender);
		createPeerConnection(data.sender);
		const peerConnection = peers[data.sender];
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
		console.log('handling answer in admin.js', data.sender);
		const peerConnection = peers[data.sender];
		if (peerConnection)
			peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
	}

	function handleIceCandidate(data) {
		console.log('handling ice candidate in admin.js', data.sender);
		const peerConnection = peers[data.sender];
		if (peerConnection)
			peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
	}

	function handleRequestPlayData(data) {
		socket.send(JSON.stringify({
			type: 'request-play',
			data: {
				target: 'admin',  // Replace with the actual admin ID
				file: fileList[video_types]['filename'],
				sender: sId
			},
		}));
	}

	// Function to get audio from the microphone
	function startAudioCapture() {
		/*navigator.mediaDevices.getUserMedia({ audio: true, video: false })
			.then((stream) => {
				// const mediaStreamSource = audioContext.createMediaStreamSource(stream);
				// mediaStreamSource.connect(audioContext.destination);
				console.log('ddd');
				adminAudioStream = stream;
				mediaRecorder = new MediaRecorder(stream);

				// Event handler for data available (called when recording is stopped)
				mediaRecorder.ondataavailable = handleDataAvailable;
				mediaRecorder.onstop = handleRecordStop;
				// stream.getTracks().forEach(track => {
				// 	peerConnection.addTrack(track, stream);
				// });
				//////////////
				mediaSource = audioContext.createMediaStreamSource(adminAudioStream);
				analyser = audioContext.createAnalyser();
				mediaSource.connect(analyser);
				analyser.connect(audioContext.destination);
				var panner = audioContext.createPanner();
				panner.setPosition(0, 0, 0);
				panner.connect(audioContext.destination);
				initCanvas('adminAudio', video_types);
			})
			.catch((error) => {
				console.error('Error accessing microphone:', error);
			});*/

		// peerConnection.onicecandidate = (event) => {
		// 	if (event.candidate) {
		// 		console.log('sending ice-candidate in admin.js')
		// 		socket.send(JSON.stringify({
		// 			type: 'ice-candidate',
		// 			data: {
		// 				candidate: event.candidate,
		// 				sender: sId
		// 			},
		// 		}));
		// 	}
		// };
	}

	function handleDataAvailable(event) {
		if (event.data.size > 0) {
			// Push the recorded data to the chunks array
			console.log(event.data);
			console.log(recordedChunks);
			recordedChunks.push(event.data);
			// sendBlobData(new Blob(recordedChunks, { type: 'audio/wav' }));
		}
	}

	function handleRecordStop() {
		sendBlobData(new Blob(recordedChunks, { type: 'audio/wav' }));
	}

	close_session_modal_btn = document.getElementById("close_live_session_btn");
	var mute_btn = document.getElementById("mute_btn");
	close_session_modal_btn.addEventListener("click", function () {
		// Store the current value before it changes
		console.log('Recording stopped');
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			// Stop recording
			stopMediaStream();
			mediaRecorder.stop();
			console.log('Recording stopped');
		}

		clearInterval(intervalID);
		initial_seconds_variable = 0;
		current_playing_session = '0';
		recordedChunks = [];
		var audioElement = document.getElementById('adminAudio');
		audioElement.pause();
	}, true); // Use capturing to ensure this runs before any other focus events
	mute_btn.addEventListener("click", function () {
		if (is_muted == false) {
			mute_btn.src = "/images/home/mute.svg";
			is_muted = true;
			if (video_types >= 0) {
				console.log('sss');
				document.getElementById('adminAudio').setAttribute('muted', is_muted);
			} else {
				const audioTrack = adminAudioStream.getAudioTracks()[0]; // Assuming there is only one audio track
				audioTrack.enabled = false; // Mute the audio track
			}
		} else {
			mute_btn.src = "/images/home/unmute.svg";
			is_muted = false;
			if (video_types >= 0) {
				console.log('ddd');
				document.getElementById('adminAudio').setAttribute('muted', is_muted);
			} else {
				const audioTrack = adminAudioStream.getAudioTracks()[0]; // Assuming there is only one audio track
				audioTrack.enabled = true; // Unmute the audio track
			}
		}
	});

	// Check if the modal is closed by clicking out side of modal window
	var modal_play = document.getElementById("past-session-modal");
	// Event listener to prevent closing the modal when clicking outside of it



	// //////////////////////////
	// modal_play.addEventListener("click", function (event) {
	// 	console.log("window click event occured");
	// 	if (event.target === modal_play) {
	// 		console.log("modal window click event occured");

	// 		clearInterval(intervalPlayer);
	// 		initial_seconds_variable = 0;
	// 		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
	// 			// Stop recording
	// 			mediaRecorder.stop();
	// 			console.log('Recording stopped');
	// 		}

	// 		clearInterval(intervalPlayer);
	// 		initial_seconds_variable = 0;
	// 		current_playing_session = '0';

	// 		recordedChunks = [];
	// 		event.preventDefault();
	// 		event.stopPropagation();
	// 	}
	// });


}
function session_manage_function() {
	const token = localStorage.getItem('brh_admin_token');
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/audio-files'),{
	//fetch('https://api.brh.lcom:8443/rest-api/admin/audio-files', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		//alert(data.data[0].filename) //stream_name
		if (data.status === "success") {
			init_admin_manage_function();
			fileList = data.data;
			const reserveList = data.reserve_date;
			let past_session_times = document.getElementsByClassName("past-session-date-display");
			let past_session_div = document.getElementById('audio-preview-past');
			let past_session_divs = past_session_div.getElementsByClassName('col-md-2');

			let past_session_ul = document.getElementById('slides-container1');
			let past_session_lis = past_session_ul.getElementsByClassName('slide');
			fileList.reverse();
			for (var i = 0; i < past_session_times.length; i++) {
				var index = i % 5;
				if (fileList.length <= index){
					past_session_times[index].setAttribute("style", "display:none;");
					past_session_times[index + 5].setAttribute("style", "display:none;");
					past_session_divs[index].setAttribute("style", "display:none;");
					past_session_lis[index].setAttribute("style", "display:none;");
				}
				else {
					past_session_times[index].innerHTML = formatDateTime(fileList[index].savetime);
					past_session_times[index + 5].innerHTML = formatDateTime(fileList[index].savetime);
				}
					
			}
			var today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed, add 1 to get the correct month
			const day = String(today.getDate()).padStart(2, '0'); // getDate() returns the day of the month

			// Format the date components into a string 'YYYY-MM-DD'
			const formattedDate1 = `${year}-${month}-${day}`;
			const session_hours = [' 05:00:00', ' 08:00:00', ' 12:00:00', ' 16:00:00', ' 19:00:00'];
			console.log(reserveList);			
			for (var i = 1; i <= 5; i++) {
				const reserveTime = formattedDate1 + session_hours[i - 1];
				for(var j = 0; j < reserveList.length; j++) {
					if (reserveTime == reserveList[j].reserve_time) {
						var reserveSelect = document.getElementById('preserve-session-' + i);
						var index = Array.from(reserveSelect.options).findIndex(option => (option.value + ".wav") == reserveList[j].filename);
						reserveSelect.selectedIndex = index;
						reserveSelect.disabled = true;
						
						reserveSelect = document.getElementById('preserve-session-' + i + i);
						index = Array.from(reserveSelect.options).findIndex(option => (option.value + ".wav") == reserveList[j].filename);
						reserveSelect.selectedIndex = index;
						reserveSelect.disabled = true;
					}
				}
			}
			updateTime();
		} else if (data.status === "failed") {
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function reserve_audio_call(reserve_time, filename) {


	var sessionschedule_procedureModal = document.getElementById("sessionschedule_adminDefaultModal");

		var yesBtn = document.getElementById("sessionschedule_useradminprocedureYesBtn"); 
	  
		function showDefaultModal() { 
			sessionschedule_procedureModal.style.display = "block";
		}
		// When the user clicks on "Yes", close the modal and do something
		yesBtn.onclick = function () {
			sessionschedule_procedureModal.style.display = "none"; 
	
		} 


	const token = localStorage.getItem('brh_admin_token');
	const param = {
		reserve_time: reserve_time,//need to update
		filename: filename
	}
	//fetch('https://api.brh.lcom:8443/rest-api/admin/reserve-call', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/reserve-call'),{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}, body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {
			showDefaultModal(); 
			setTimeout(()=> {
				window.location.reload();
			}, 3000);
		} else if (data.status === "failed") {
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function cancel_reserve_audio_call(reserve_time) {
	const token = localStorage.getItem('brh_admin_token');
	const param = {
		reserve_time: reserve_time//need to update
	}
	//fetch('https://api.brh.lcom:8443/rest-api/admin/cancel-reserve-call', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/cancel-reserve-call'),{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}, body: JSON.stringify(param),
	}).then(response => {
		console.log("response>>>", response);
		return response.json();
	}).then(data => {
		console.log("data>>>>", data);
		if (data.status === "success") {
			init_admin_manage_function();
		} else if (data.status === "failed") {
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function init_admin_manage_function() {
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


	const slidesContainer1 = document.getElementById("slides-container-upcoming");
	const slide1 = document.querySelector(".slide-upcoming");
	const prevButton1 = document.getElementById("slide-arrow-prev-upcoming");
	const nextButton1 = document.getElementById("slide-arrow-next-upcoming");

	nextButton1.addEventListener("click", () => {
		const slideWidth1 = slide1.clientWidth;
		slidesContainer1.scrollLeft += slideWidth1;
	});

	prevButton1.addEventListener("click", () => {
		const slideWidth1 = slide1.clientWidth;
		slidesContainer1.scrollLeft -= slideWidth1;
	});
	var session_no = '';
	var session_time = '';



	var combo1 = document.getElementById("preserve-session-1");
	var combo1_currentValue = '';
	// Add an event listener for the "focus" event to store the current value
	combo1.addEventListener("focus", function () {
		// Store the current value before it changes
		combo1_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	combo1.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('1', selectedValue);
		}
		else {
			showModal('1', '0');
		}
	});



	var combo2 = document.getElementById("preserve-session-2");
	var combo2_currentValue = '';
	// Add an event listener for the "focus" event to store the current value
	combo2.addEventListener("focus", function () {
		// Store the current value before it changes
		combo2_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	combo2.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('2', selectedValue);
		}
		else {
			showModal('2', '0');
		}
	});



	var combo3 = document.getElementById("preserve-session-3");
	var combo3_currentValue = '';
	// Add an event listener for the "focus" event to store the current value
	combo3.addEventListener("focus", function () {
		// Store the current value before it changes
		combo3_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	combo3.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('3', selectedValue);
		}
		else {
			showModal('3', '0');
		}
	});




	var combo4 = document.getElementById("preserve-session-4");
	var combo4_currentValue = '';
	// Add an event listener for the "focus" event to store the current value
	combo4.addEventListener("focus", function () {
		// Store the current value before it changes
		combo4_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	combo4.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('4', selectedValue);
		}
		else {
			showModal('4', '0');
		}
	});



	var combo5 = document.getElementById("preserve-session-5");
	var combo5_currentValue = '';
	// Add an event listener for the "focus" event to store the current value
	combo5.addEventListener("focus", function () {
		// Store the current value before it changes
		combo5_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	combo5.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('5', selectedValue);
		}
		else {
			showModal('5', '0');
		}
	});




	var mobile_combo1 = document.getElementById("preserve-session-11");
	var mobile_combo1_currentValue = '';
	function updateCurrentValue1() {
		mobile_combo1_currentValue = mobile_combo5.value;
	}
	// Add an event listener for the "focus" event to store the current value
	mobile_combo1.addEventListener("mousedown", updateCurrentValue1);
	mobile_combo1.addEventListener("touchstart", updateCurrentValue1);
	// Add an event listener for the "focus" event to store the current value
	mobile_combo1.addEventListener("focus", function () {
		// Store the current value before it changes
		mobile_combo1_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	mobile_combo1.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('1', selectedValue);
		}
		else {
			showModal('1', '0');
		}
	});

	var mobile_combo2 = document.getElementById("preserve-session-22");
	var mobile_combo2_currentValue = '';
	function updateCurrentValue2() {
		mobile_combo2_currentValue = mobile_combo2.value;
	}
	// Add an event listener for the "focus" event to store the current value
	mobile_combo2.addEventListener("mousedown", updateCurrentValue2);
	mobile_combo2.addEventListener("touchstart", updateCurrentValue2);
	// Add an event listener for the "focus" event to store the current value
	mobile_combo2.addEventListener("focus", function () {
		// Store the current value before it changes
		mobile_combo2_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	mobile_combo2.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('2', selectedValue);
		}
		else {
			showModal('2', '0');
		}
	});

	var mobile_combo3 = document.getElementById("preserve-session-33");
	var mobile_combo3_currentValue = '';
	function updateCurrentValue3() {
		mobile_combo3_currentValue = mobile_combo3.value;
	}
	// Add an event listener for the "focus" event to store the current value
	mobile_combo3.addEventListener("mousedown", updateCurrentValue3);
	mobile_combo3.addEventListener("touchstart", updateCurrentValue3);
	// Add an event listener for the "focus" event to store the current value
	mobile_combo3.addEventListener("focus", function () {
		// Store the current value before it changes
		mobile_combo3_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	mobile_combo3.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('3', selectedValue);
		}
		else {
			showModal('3', '0');
		}
	});

	var mobile_combo4 = document.getElementById("preserve-session-44");
	var mobile_combo4_currentValue = '';
	function updateCurrentValue4() {
		mobile_combo4_currentValue = mobile_combo4.value;
	}
	// Add an event listener for the "focus" event to store the current value
	mobile_combo4.addEventListener("mousedown", updateCurrentValue4);
	mobile_combo4.addEventListener("touchstart", updateCurrentValue4);
	// Add an event listener for the "focus" event to store the current value
	mobile_combo4.addEventListener("focus", function () {
		// Store the current value before it changes
		mobile_combo4_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events
	mobile_combo4.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('4', selectedValue);
		}
		else {
			showModal('4', '0');
		}
	});

	var mobile_combo5 = document.getElementById("preserve-session-55");
	var mobile_combo5_currentValue = '';
	function updateCurrentValue5() {
		mobile_combo5_currentValue = mobile_combo5.value;
	}
	// Add an event listener for the "focus" event to store the current value
	mobile_combo5.addEventListener("mousedown", updateCurrentValue5);
	mobile_combo5.addEventListener("touchstart", updateCurrentValue5);
	// Add an event listener for the "focus" event to store the current value
	mobile_combo5.addEventListener("focus", function () {
		// Store the current value before it changes
		mobile_combo5_currentValue = this.value;
	}, true); // Use capturing to ensure this runs before any other focus events

	mobile_combo5.addEventListener("change", function () {
		var selectedValue = this.value;
		if (selectedValue != 'option') {
			showModal('5', selectedValue);
		}
		else {
			showModal('5', '0');
		}
	});







	var procedureModal = document.getElementById("procedureModal");
	// Get the buttons that opens the modal
	var yesBtn = document.getElementById("procedureYesBtn");
	var noBtn = document.getElementById("procedureNoBtn");




	function showModal(sess_no, sess_time) {
		session_no = sess_no;
		session_time = sess_time;

		var procedureTitle = document.getElementById("procedure_title");
		if (session_time == '0') {
			procedureTitle.textContent = "Do you want to cancel this session playing?";
		}
		else {
			procedureTitle.textContent = "Do you want to add this session as playing?";

		}
		procedureModal.style.display = "block";
	}
	// When the user clicks on "Yes", close the modal and do something
	yesBtn.onclick = function () {
		procedureModal.style.display = "none";
		// Add your action after "Yes" is clicked
		var today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed, add 1 to get the correct month
		const day = String(today.getDate()).padStart(2, '0'); // getDate() returns the day of the month

		// Format the date components into a string 'YYYY-MM-DD'
		const formattedDate1 = `${year}-${month}-${day}`;
		const session_hours = [' 05:00:00', ' 08:00:00', ' 12:00:00', ' 16:00:00', ' 19:00:00'];
		const reserveTime = formattedDate1 + session_hours[session_no - 1];
		if (session_time == '0') {
			//cancel the reservation session playing...
			cancel_reserve_audio_call(reserveTime);
		} else {
			//update the reservation time of session playing....
			reserve_audio_call(reserveTime, session_time);
		}

	}

	// When the user clicks on "No", close the modal
	noBtn.onclick = function () {
		procedureModal.style.display = "none";
		// Add your action after "No" is clicked
		if (session_no == '1') {
			combo1.value = combo1_currentValue;
			mobile_combo1.value = mobile_combo1_currentValue;
		}

		if (session_no == '2') {

			combo2.value = combo2_currentValue;

			mobile_combo2.value = mobile_combo2_currentValue;
		}

		if (session_no == '3') {

			combo3.value = combo3_currentValue;

			mobile_combo3.value = mobile_combo3_currentValue;
		}

		if (session_no == '4') {

			combo4.value = combo4_currentValue;

			mobile_combo4.value = mobile_combo4_currentValue;
		}

		if (session_no == '5') {

			combo5.value = combo5_currentValue;

			mobile_combo5.value = mobile_combo5_currentValue;
		}
	}


	//play the past session based on the clicking.......
	var past_paying_sesssion = '0';
	// Select the <i> element by its ID
	var past_playIcon1 = document.getElementById('past_session_1');

	// Manually add a click event listener to the <i> element
	past_playIcon1.addEventListener('click', function (event) { 
		// Prevent the default Bootstrap modal behavior 
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-recorded-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '1';
		initSocket(0);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[0].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});
	// Select the <i> element by its ID
	var past_playIcon11 = document.getElementById('past_session_11');

	// Manually add a click event listener to the <i> element
	past_playIcon11.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '1';

		initSocket(0);

		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[0].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		  });
		// Show the modal
		modalInstance.show();
	});

	// Select the <i> element by its ID
	var past_playIcon2 = document.getElementById('past_session_2');

	// Manually add a click event listener to the <i> element
	past_playIcon2.addEventListener('click', function (event) {
													   //alert("")
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '2';

		initSocket(1);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[1].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
		
		
	});
	// Select the <i> element by its ID
	var past_playIcon22 = document.getElementById('past_session_22');

	// Manually add a click event listener to the <i> element
	past_playIcon22.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '2';

		initSocket(1);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[1].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});

	// Select the <i> element by its ID
	var past_playIcon3 = document.getElementById('past_session_3');

	// Manually add a click event listener to the <i> element
	past_playIcon3.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '3';

		initSocket(2);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[2].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});
	// Select the <i> element by its ID
	var past_playIcon33 = document.getElementById('past_session_33');

	// Manually add a click event listener to the <i> element
	past_playIcon33.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '3';

		initSocket(2);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[2].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});

	// Select the <i> element by its ID
	var past_playIcon4 = document.getElementById('past_session_4');

	// Manually add a click event listener to the <i> element
	past_playIcon4.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '4';

		initSocket(3);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[3].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});
	// Select the <i> element by its ID
	var past_playIcon44 = document.getElementById('past_session_44');

	// Manually add a click event listener to the <i> element
	past_playIcon44.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '4';

		initSocket(3);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[3].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});


	// Select the <i> element by its ID
	var past_playIcon5 = document.getElementById('past_session_5');

	// Manually add a click event listener to the <i> element
	past_playIcon5.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '5';

		initSocket(4);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[4].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});
	// Select the <i> element by its ID
	var past_playIcon55 = document.getElementById('past_session_55');

	// Manually add a click event listener to the <i> element
	past_playIcon55.addEventListener('click', function (event) {
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		// Get the modal element by its ID specified in the data-bs-target attribute 
		var targetModalElement = document.getElementById('past-session-modal');
		// Create a new instance of the Bootstrap Modal using the target modal element
		past_paying_sesssion = '5';

		initSocket(4);

		initial_seconds_variable = 0;
		document.getElementById('live_logo_img').setAttribute('style', 'display:none;');
		document.getElementById('mute_btn').setAttribute('style', 'display:none;');
		document.getElementById('past_savetime_txt').setAttribute('style', 'display: block;');
		document.getElementById('past_savetime_txt').innerText = convert_time(fileList[4].savetime);
		clearInterval(intervalID);
		seconds = 59;
		minutes = 29;
		intervalID = setInterval(updateClock, 1000);
		var modalInstance = new bootstrap.Modal(targetModalElement,{
			backdrop: 'static' // Prevent closing by clicking outside
		});
		// Show the modal
		modalInstance.show();
	});







	// Select the <i> element by its ID
	var playIcon1 = document.getElementById('upcoming-session-play-1');

	// Manually add a click event listener to the <i> element
	playIcon1.addEventListener('click', function (event) { console.log(" ATLERS3 -----------> 3")
		// Prevent the default Bootstrap modal behavior 
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		if (playIcon1.classList.contains('fa-play') && !playIcon1.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '1';
			//initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29; //atlers yaha1
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			const script = document.createElement('script');
			script.src = './scripts/streams/audio_stream.js';
			script.type = 'module';
			document.body.appendChild(script)
		}
	});

	// Select the <i> element by its ID
	var playIcon11 = document.getElementById('upcoming-session-play-11');

	// Manually add a click event listener to the <i> element
	playIcon11.addEventListener('click', function (event) {
		// Check if the <i> element has 'fa-play' class and not 'fa-hourglass' class
		if (playIcon11.classList.contains('fa-play') && !playIcon11.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '1';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			//alert("yaha4")
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});





	// Select the <i> element by its ID
	var playIcon2 = document.getElementById('upcoming-session-play-2');

	// Manually add a click event listener to the <i> element
	playIcon2.addEventListener('click', function (event) {
		if (playIcon2.classList.contains('fa-play') && !playIcon2.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '2';
			//initSocket(-1); //atlers
			/* atlers

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClockIncrease, 1000);
			alert(""+targetModalElement.innerHTML)*/
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
			const script = document.createElement('script');
			script.src = './scripts/streams/audio_stream.js';
			script.type = 'module';
			document.body.appendChild(script)
			
		}
	});

	// Select the <i> element by its ID
	var playIcon22 = document.getElementById('upcoming-session-play-22');

	// Manually add a click event listener to the <i> element
	playIcon22.addEventListener('click', function (event) {
		if (playIcon22.classList.contains('fa-play') && !playIcon22.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '2';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			alert("yaha5")
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});


	// Select the <i> element by its ID
	var playIcon3 = document.getElementById('upcoming-session-play-3');

	// Manually add a click event listener to the <i> element
	playIcon3.addEventListener('click', function (event) {
		if (playIcon3.classList.contains('fa-play') && !playIcon3.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '3';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;alert("yaha6")
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});

	// Select the <i> element by its ID
	var playIcon33 = document.getElementById('upcoming-session-play-33');

	// Manually add a click event listener to the <i> element
	playIcon33.addEventListener('click', function (event) {
		if (playIcon33.classList.contains('fa-play') && !playIcon33.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '3';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;alert("yaha78")
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});



	// Select the <i> element by its ID
	var playIcon4 = document.getElementById('upcoming-session-play-4');

	// Manually add a click event listener to the <i> element
	playIcon4.addEventListener('click', function (event) {
		if (playIcon4.classList.contains('fa-play') && !playIcon4.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '4';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});
	// Select the <i> element by its ID
	var playIcon44 = document.getElementById('upcoming-session-play-44');

	// Manually add a click event listener to the <i> element
	playIcon44.addEventListener('click', function (event) {
		if (playIcon44.classList.contains('fa-play') && !playIcon44.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '4';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});



	// Select the <i> element by its ID
	var playIcon5 = document.getElementById('upcoming-session-play-5');

	// Manually add a click event listener to the <i> element
	playIcon5.addEventListener('click', function (event) {
		if (playIcon5.classList.contains('fa-play') && !playIcon5.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '5';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});
	// Select the <i> element by its ID
	var playIcon55 = document.getElementById('upcoming-session-play-55');

	// Manually add a click event listener to the <i> element
	playIcon55.addEventListener('click', function (event) {
		if (playIcon55.classList.contains('fa-play') && !playIcon55.classList.contains('fa-hourglass-start')) {
			// Get the modal element by its ID specified in the data-bs-target attribute 
			var targetModalElement = document.getElementById('past-session-modal');
			// Create a new instance of the Bootstrap Modal using the target modal element
			current_playing_session = '5';
			initSocket(-1);

			initial_seconds_variable = 0;
			document.getElementById('live_logo_img').setAttribute('style', 'display:block;');
			document.getElementById('mute_btn').setAttribute('style', 'display:block;');
			document.getElementById('past_savetime_txt').setAttribute('style', 'display: none;');
			clearInterval(intervalID);
			seconds = 59;
			minutes = 29;
			intervalID = setInterval(updateClockIncrease, 1000);
			var modalInstance = new bootstrap.Modal(targetModalElement,{
				backdrop: 'static' // Prevent closing by clicking outside
			});
			// Show the modal
			modalInstance.show();
		}
	});








}

function addLeadingZero(number) {
	return number < 10 ? '0' + number : number.toString();
}
function updatePlayTime() {


	initial_seconds_variable++;

	var playingTimer = document.getElementById('live_session_playing_timer');

	//var time_calc = 30 * 60 - minutes * 60 - seconds;
	console.log("fefefefe ", initial_seconds_variable);
	playingTimer.innerHTML = `&#8987; ${addLeadingZero(parseInt(initial_seconds_variable / 60))}: ${addLeadingZero(initial_seconds_variable % 60)}`;


}
var seconds = 59;
var minutes = 29;
function updateClock() {
	

	// Format the time
	var timeString = minutes.toString().padStart(2, '0') + ' : ' + seconds.toString().padStart(2, '0');

	// Update the clock display
	document.getElementById('live_session_playing_timer').textContent = '⌛ ' + timeString;
	seconds--;
	if (seconds == -1) {
		seconds = 59;
		minutes--;
		if (minutes == -1) {
			minutes = 29;
		}
	}
}
function checkIsInRangeTime(rangeTime, caseHour = -1) { 
	let h = rangeTime.getHours();
	let m = rangeTime.getMinutes();
	let s = rangeTime.getSeconds();
	var timeString = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
	console.log("ATLERS4 casehour is "+caseHour+" -------->checkIsInRangeTime " +timeString + "--"+ (timeString <= '05:30:00' && !isExcludedDay(rangeTime) )  )
	
	//alert(timeString + " ----- "+ ( timeString >= '05:00:00' && timeString <= '05:30:00' ))
	switch (caseHour) {
		case 5:
			return (timeString <= '05:30:00' && !isExcludedDay(rangeTime));
		case 8:
			return (timeString <= '08:30:00' && !isExcludedDay(rangeTime));
		case 12:
			return (timeString <= '12:30:00' && !isExcludedDay(rangeTime));
		case 16:
			return (timeString <= '16:30:00' && !isExcludedDay(rangeTime));
		case 19:
			return (timeString <= '19:30:00' && !isExcludedDay(rangeTime));
		default:
			return	(timeString >= '05:00:00' && timeString <= '05:30:00' && !isExcludedDay(rangeTime)) ||
			(timeString >= '08:00:00' && timeString <= '08:30:00' && !isExcludedDay(rangeTime)) ||
			(timeString >= '12:00:00' && timeString <= '12:30:00' && !isExcludedDay(rangeTime)) ||
			(timeString >= '16:00:00' && timeString <= '16:30:00' && !isExcludedDay(rangeTime)) ||
			(timeString >= '19:00:00' && timeString <= '19:30:00' && !isExcludedDay(rangeTime));
	}
}
function updateClockIncrease() {
	//alert("ok")
	var currentTime = new Date(convert_local_time(new Date(), false, false)); console.log("Atlers current time is "+currentTime )
	//atelrs
	currentTime.setFullYear((new Date()).getFullYear());
	let cur_hour = currentTime.getHours();
	
	//-----
	var isInRangeTime = checkIsInRangeTime(currentTime);
	var audioAnimationDiv = document.getElementById('audio-player-bar-container');
	if (!isInRangeTime)
	{
		audioAnimationDiv.style = 'display: none';
		return;
	}
	if (mediaRecorder && mediaRecorder.state == 'inactive')
		mediaRecorder.start();
	audioAnimationDiv.style = 'display: block';
	// Increment seconds and minutes

	// Format the time
	var timeString = minutes.toString().padStart(2, '0') + ' : ' + seconds.toString().padStart(2, '0');

	// Update the clock display
	document.getElementById('live_session_playing_timer').textContent = '⌛ ' + timeString;
	seconds--;
	if (seconds == -1) {
		seconds = 59;
		minutes--;
		if (minutes == -1) {
			minutes = 29;
			close_session_modal_btn.click();
			// setTimeout(()=> {
			// 	window.location.reload();
			// }, 3000);;
		}
	}
}
function admin_login_function() {


	var procedureModal = document.getElementById("adminDefaultModal");

	var yesBtn = document.getElementById("adminprocedureYesBtn"); 
  
	function showDefaultModal() { 
		procedureModal.style.display = "block";
	}
	// When the user clicks on "Yes", close the modal and do something
	yesBtn.onclick = function () {
		procedureModal.style.display = "none"; 

	} 




	const btn_login = document.getElementById('login-button');
	console.log(btn_login);



	btn_login.addEventListener("click", () => {
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

		if(validate_erro_flag==0)
		{
			//fetch('https://api.brh.lcom:8443/rest-api/admin/signin', {
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/signin'),{
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
					localStorage.setItem('brh_admin_token', data.msg);
					localStorage.setItem('brh_admin_email', username);
					window.location.href = '/dashboard';
				} else if (data.status === "failed") {
					showDefaultModal();
				}
			}).catch(error => {
				showDefaultModal();
				console.error('There was a problem with the fetch operation:', error);
			});
		}
	});
}

function dashboard_function() {
	const token = localStorage.getItem('brh_admin_token');
	//fetch('https://api.brh.lcom:8443/rest-api/admin/dashboard', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/dashboard'),{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
	}).then(response => {
		return response.json();
	}).then(data => {
		const txtActiveUsers = document.getElementById('txtActiveUsers');
		const txtSubscribedUsers = document.getElementById('txtSubscribedUsers');
		const txtGeneratedRevenue = document.getElementById('txtGeneratedRevenue');
		txtActiveUsers.innerHTML = data.mActiveUsersCount;
		txtSubscribedUsers.innerHTML = data.mSubscribedUsersCount
		txtGeneratedRevenue.innerHTML ='$' + data.mGeneratedRevenue;
		var picker1 = new Pikaday({
			field: document.getElementById('datepicker_from')
		});
		var picker2 = new Pikaday({
			field: document.getElementById('datepicker_to')
		});

		var calculate_generate_revenue = document.getElementById('calculate_generate_revenue');
		calculate_generate_revenue.addEventListener("click", () => {
			const param = {
				from_date: document.getElementById('datepicker_from').value.toString(),
				end_date: document.getElementById('datepicker_to').value.toString(),
			}
			//fetch('https://api.brh.lcom:8443/rest-api/admin/dashboard-revenue', {
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/dashboard-revenue'),{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}, body: JSON.stringify(param)
			}).then(response => {
				return response.json();
			}).then(data => {
				console.log("generated Revenue = ", data.mGeneratedRevenue);
				txtGeneratedRevenue.innerHTML = '$' + data.mGeneratedRevenue;
			}).catch(error => {
				console.error('There was a problem with the fetch operation:', error);
			});
		});
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});



}
function home_upcoming_session_showing_function() {
	//Show and Hide the upcoming session videos

	var cur_Time = new Date(convert_local_time(new Date(), false, false));
	
	cur_Time.setFullYear((new Date()).getFullYear());
	let cur_hour = cur_Time.getHours();
	console.log(cur_Time, cur_hour);
	var upcoming_show_1 = document.getElementById('upcoming-1');
	var upcoming_show_2 = document.getElementById('upcoming-2');
	var upcoming_show_3 = document.getElementById('upcoming-3');
	var upcoming_show_4 = document.getElementById('upcoming-4');
	var upcoming_show_5 = document.getElementById('upcoming-5');
	var upcoming_show_11 = document.getElementById('upcoming-11');
	var upcoming_show_22 = document.getElementById('upcoming-22');
	var upcoming_show_33 = document.getElementById('upcoming-33');
	var upcoming_show_44 = document.getElementById('upcoming-44');
	var upcoming_show_55 = document.getElementById('upcoming-55');

	var dayOfWeek = cur_Time.getDay();
	
	if (dayOfWeek === 3 || dayOfWeek === 6 || dayOfWeek === 0) 
	{ 
		
		console.log(" ATLERS1 -----------> 1")
		upcoming_show_1.style.display = 'none';
		upcoming_show_11.style.display = 'none';
		upcoming_show_2.style.display = 'none';
		upcoming_show_22.style.display = 'none';
		upcoming_show_3.style.display = 'none';
		upcoming_show_33.style.display = 'none';
		upcoming_show_4.style.display = 'none';
		upcoming_show_44.style.display = 'none';
		upcoming_show_5.style.display = 'none';
		upcoming_show_55.style.display = 'none';
	} 
	else 
	{ 
		console.log(" ATLERS2 -----------> 2")
		if (!checkIsInRangeTime(cur_Time, 5) ) {
			upcoming_show_1.style.display = 'none';
			upcoming_show_11.style.display = 'none';
		}
		if (!checkIsInRangeTime(cur_Time, 8)) {
			upcoming_show_2.style.display = 'none';
			upcoming_show_22.style.display = 'none';
		}
		if (!checkIsInRangeTime(cur_Time, 12)) {
			upcoming_show_3.style.display = 'none';
			upcoming_show_33.style.display = 'none';
		}
		if (!checkIsInRangeTime(cur_Time, 16)) {
			upcoming_show_4.style.display = 'none';
			upcoming_show_44.style.display = 'none';
		}
		if (!checkIsInRangeTime(cur_Time, 19)) {
			upcoming_show_5.style.display = 'none';
			upcoming_show_55.style.display = 'none';
		}

	}

	
	var show_today = document.getElementById('show-date-today');
	var show_today1 = document.getElementById('show-date-today1');

	var show_yesterday = document.getElementById('show-date-yesterday');
	var show_yesterday1 = document.getElementById('show-date-yesterday1');


	var today_t = new Date();
	var yesterday_t = new Date(today_t);
	yesterday_t.setDate(today_t.getDate() - 1);


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	console.log(cur_Time, 'pppp');
	var formattedDate = cur_Time.getDate() + ' ' + months[cur_Time.getMonth()] + ' ' + cur_Time.getFullYear();
	var formattedDate_yesterday = yesterday_t.getDate() + ' ' + months[yesterday_t.getMonth()] + ' ' + yesterday_t.getFullYear();


	show_today.innerHTML = `Today - ${formattedDate}`;
	show_today1.innerHTML = `Today - ${formattedDate}`;

 
	show_yesterday.innerHTML = ` `;
	show_yesterday1.innerHTML = ` `;

}

// function convert_time(serverTime) {
// 	// Convert server time to user's local time
// 	const serverTimeZone = 'America/Denver';
// 	const localTime = new Date(serverTime);
// 	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// 	console.log(userTimeZone);
// 	const userLocalTime = new Date(localTime.toLocaleString('en-US', { timeZone: userTimeZone }));

// 	// Format the local time
// 	const options = { month: 'short', day: 'numeric', hour: 'numeric', hour12: true };
// 	const formattedTime = userLocalTime.toLocaleString('en-US', options);

// 	return formattedTime;
// }

function formatDateTime(timeStr) {
	var serverTime = new Date(timeStr);
	// Format the local time
	const options = { month: 'short', day: 'numeric', hour: 'numeric', hour12: true };
	const formattedTime = serverTime.toLocaleString('en-US', options);

	return formattedTime;
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

function convert_local_time(localTimeStr, includeSecond, isReturnString = true) {

	// Get the local time zone offset in minutes
	var localTimezoneOffset = new Date().getTimezoneOffset();

	// Define Mountain time zone offset in minutes (7 hours behind UTC)
	var mountainTimezoneOffset = 7 * 60;
	// Calculate the difference between Mountain time zone offset and local time zone offset
	var offsetDifference = localTimezoneOffset - mountainTimezoneOffset;
	// Calculate the local time by adjusting the server time using the offset difference
	var localTime = new Date(new Date(localTimeStr).getTime() + (offsetDifference * 60000));
	if (!isReturnString)
		return localTime;
	// Format the local time
	if (includeSecond) {
		
		const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', 'second': 'numeric', hour12: true };
		const formattedTime = localTime.toLocaleString('en-US', options);
		return formattedTime;	
	}
	const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
	const formattedTime = localTime.toLocaleString('en-US', options);
	return formattedTime;
}

function home_function() {

	var btn_open = document.querySelector('.btn-menu')
	var menu = document.querySelector('.menu')
	menu.addEventListener('click', function (event) {
		if (event.target.tagName.toLowerCase() === 'a') {
			btn_open.classList.remove('close')
			menu.classList.remove('show')
		}
	})
	btn_open.addEventListener('click', function () {
		if (btn_open.classList.contains('close')) {
			btn_open.classList.remove('close')
			menu.classList.remove('show')
		} else {
			btn_open.classList.add('close')
			menu.classList.add('show')
		}
	})

	

	 

}
function admin_user_management_function() {
	const token = localStorage.getItem('brh_admin_token');
	console.log(token)
	//fetch('https://api.brh.lcom:8443/rest-api/admin/users', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/users'),{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
	}).then(response => {
		return response.json();
	}).then(data => {
		let tableData = [];
		data = data.data;
		for (let i = 0; i < data.length; i++) {
			let ele = data[i];
			tableData.push([i + 1, ele.surname, ele.forename, ele.email, ele.join_date, ele.status, null]);
		}

		var procedureModal = document.getElementById("useradminDefaultModal");

		var yesBtn = document.getElementById("useradminprocedureYesBtn"); 
	  
		function showDefaultModal() { 
			procedureModal.style.display = "block";
		}
		// When the user clicks on "Yes", close the modal and do something
		yesBtn.onclick = function () {
			procedureModal.style.display = "none"; 
	
		} 
	

		const btn_invite = document.getElementById('btn_send');
		btn_invite.addEventListener("click", () => {
			const submit_param = {
				"email": document.getElementById('txt_email').value
			};

			//fetch('https://api.brh.lcom:8443/rest-api/admin/invite', {
			fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/invite'),{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(submit_param),
			}).then(response => {
				console.log("response>>>", response);
				return response.json();
			}).then(data => {
				console.log("data>>>>", data);
				if (data.status === "success") {
					showDefaultModal();
				} else if (data.status === "failed") {
				}
			}).catch(error => {
				console.error('There was a problem with the fetch operation:', error);
			});
		});
		new gridjs.Grid({
			columns: [
				{
					name: "No",
				},
				{
					name: "First Name",
				},
				{
					name: "Last Name",
				},
				{
					name: "Email",
				},
				{
					name: "Joining Date",
 
				},
				{
					name: 'Account Status', 
				},
			],
			pagination: true,
			pagination: {
				limit: 50
			},
			sort: true,
			search: true,
			data: tableData
		}).render(document.getElementById("wrapper"));
		// coded by Pride
		document.querySelector('input.gridjs-search-input')?.setAttribute('placeholder', 'Enter First/Last Name');
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function admin_user_affiliate_management_function() {
	const token = localStorage.getItem('brh_admin_token');
	 console.log(token)
	//fetch('https://api.brh.lcom:8443/rest-api/admin/afilliate-users', {
	fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/afilliate-users'),{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
	}).then(response => {
		return response.json();
	}).then(data => { 
		let tableData = [];
		data = data.data;
		for (let i = 0; i < data.length; i++) {
			let ele = data[i];
			tableData.push([i + 1, ele.firstname + " " + ele.lastname, ele.email, ele.subscribed_users_count, ele.status, null, ele.status]);
		}

		new gridjs.Grid({
			columns: [
				{
					name: "No",
				},
				{
					name: "Fullname",
				},
				{
					name: "Email",
				},
				{
					name: "Subscribed users",
				},
				{
					name: "Account Status",
				},
				{
					name: 'Statistics',
					formatter: (cell, row) => {
						const subscribed_users = document.getElementById('subscribed_users_txt');
						const general_revenue = document.getElementById('general_revenue_txt');
						const chart_revenue = document.getElementById('revenue_chart');
						return h('button', {
							className: 'admin-user-status-btn',
							onClick: () => {
								const param = {
									'email': row._cells[2].data
								}
								//fetch('https://api.brh.lcom:8443/rest-api/admin/affiliate-user-statistics', {
								fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/affiliate-user-statistics'),{
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
										document.querySelector("#user-management-account-active-modal-btn").click();
										subscribed_users.innerText = data.mSubscribedUsersCount;
										general_revenue.innerText ='$' +  data.mGeneratedRevenue;
										let truncatedNum = Math.floor(data.mGeneratedRevenue * 0.3 * 100) / 100;
										chart_revenue.innerText ='$' +  truncatedNum;
									} else if (data.status === "failed") {
									}
								}).catch(error => {
									console.error('There was a problem with the fetch operation:', error);
								});
							},
						}, 'View Statistics');
					}
				},
				{
					name: 'Edit Action',
					formatter: (cell, row) => {
						return h('button', {
							className: 'admin-user-status-btn',
							onClick: () => {
								const ele1 = document.getElementById('change_status_txt');

								if (cell == 'active') {
									ele1.innerText = "Are you sure inactivate the account ? ";
								} else {
									ele1.innerText = "Are you sure activate the account ? ";
								}
								document.querySelector("#user-affiliate-management-statistics-modal-btn").click();
								const ele = document.getElementById('change_status_btn');
								const token = localStorage.getItem('brh_admin_token');
								const param = {
									'email': row._cells[2].data,
									'status': cell == 'active' ? 'inactive' : 'active'
								}
								ele.addEventListener('click', () => {
									//fetch('https://api.brh.lcom:8443/rest-api/admin/affiliate-status', {
									fetch(switchToSubdomain(window.location.href, 'api', 'rest-api/admin/affiliate-status'),{
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
											window.location.href = '/affiliate';
										} else if (data.status === "failed") {
										}
									}).catch(error => {
										console.error('There was a problem with the fetch operation:', error);
									});
								});
							},
						}, cell == 'active' ? 'Stop Affiliation' : 'Start Affiliation');
					}
				},
			],
			pagination: true,
			pagination: {
				limit: 50
			},
			sort: true,
			search: true,
			data: tableData
		}).render(document.getElementById("wrapper"));
		// coded by Pride
		const element = document.querySelector('.gridjs-head .gridjs-search .gridjs-search-input');
		element.setAttribute("placeholder", "Enter Fullname");
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
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
			modal_view.style.display = 'flex';
		}
		if (event.target.classList.contains('btn-close-modal')) {
			const modal_view = document.querySelector('#recoverAlert');
			modal_view.style.display = 'none';
		}
		if (event.target.classList.contains('audio-preview-img')) {
			const modal_view = document.querySelector('#musicplayer');
			const modal_preview = document.querySelector('#audio-preview');
			modal_view.style.display = 'block';
			modal_preview.style.display = 'none';
		}
		if (event.target.classList.contains('affiliate-login-tab-nav')) {
			var tabId = event.target.getAttribute('data-id');
			console.log('tabId', tabId)

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
			const modal_view = document.querySelector('#affiliaterecoverAlert');
			modal_view.style.display = 'flex';

		}
		if (event.target.classList.contains('btn-close-modal')) {
			const modal_view = document.querySelector('#affiliaterecoverAlert');
			modal_view.style.display = 'none';

		}
		if (event.target.classList.contains('full-screen')) {
			console.log("musci player fullscreen button clickec");
			var elem = document.getElementById('musicplayer');
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				elem.requestFullscreen();
			}
		}
	})
}


function updateTime() {

	var currentTime = new Date();

	var Years = currentTime.getFullYear();
	var Month = currentTime.getMonth() + 1;
	var Days = currentTime.getDate();
	var currentDate = new Date();

	const options = { month: 'short', day: 'numeric', hour: 'numeric', 'minute': 'numeric', 'second': 'numeric', hour12: true };
	let formattedTime = currentTime.toLocaleString('en-US', options);
	formattedTime = convert_local_time(new Date(), true);
	document.getElementById('localTime').innerText = 'Current time: ' + formattedTime;

	var currentDate = Years + "-" + Month + "-" + Days + " ";
	if (Days == 1) {
		Days = 30
	}
	else {
		Days = Days - 1;
	}


	var dateString = Years + "/" + Month + "/" + Days + " ";
	currentTime = new Date(convert_local_time(currentTime, false, false));
	let hours1 = currentTime.getHours();
	let minutes1 = currentTime.getMinutes();
	let seconds1 = currentTime.getSeconds();
	var timeString = hours1 + ':' + (minutes1 < 10 ? '0' : '') + minutes1;



	//Showing the audio bar when the playing time.
	//playbutton control for time
	var isInRange1 = timeString >= '4:50' && timeString <= '5:00' && !isExcludedDay(currentTime);
	var isInRange2 = timeString >= '7:50' && timeString <= '8:00' && !isExcludedDay(currentTime);
	var isInRange3 = timeString >= '11:50' && timeString <= '12:00' && !isExcludedDay(currentTime);
	var isInRange4 = timeString >= '15:50' && timeString <= '16:00' && !isExcludedDay(currentTime);
	var isInRange5 = timeString >= '18:50' && timeString <= '19:00' && !isExcludedDay(currentTime);

	if(page_index == 5)
	{
		if (isInRange1) {
			var playSetting1 = document.getElementById('upcoming-session-play-1');
			playSetting1.classList.add("fa-play");
			playSetting1.classList.remove("fa-hourglass-start");
	
			//For mobile view
			var playSetting11 = document.getElementById('upcoming-session-play-11');
			playSetting11.classList.add("fa-play");
			playSetting11.classList.remove("fa-hourglass-start");
	
		} else {
			var playSetting1 = document.getElementById('upcoming-session-play-1');
			playSetting1.classList.add("fa-hourglass-start");
			playSetting1.classList.remove("fa-play");
	
			//For mobile view
			var playSetting11 = document.getElementById('upcoming-session-play-11');
			playSetting11.classList.add("fa-hourglass-start");
			playSetting11.classList.remove("fa-play");
		}
	
		if (isInRange2) {
			var playSetting2 = document.getElementById('upcoming-session-play-2');
			playSetting2.classList.add("fa-play");
			playSetting2.classList.remove("fa-hourglass-start");
	
			//For mobile view
			var playSetting22 = document.getElementById('upcoming-session-play-22');
			playSetting22.classList.add("fa-play");
			playSetting22.classList.remove("fa-hourglass-start");
		} else {
			var playSetting2 = document.getElementById('upcoming-session-play-2');
			playSetting2.classList.add("fa-hourglass-start");
			playSetting2.classList.remove("fa-play");
			//For mobile view
			var playSetting22 = document.getElementById('upcoming-session-play-22');
			playSetting22.classList.add("fa-hourglass-start");
			playSetting22.classList.remove("fa-play");
		}
	
		if (isInRange3) {
			var playSetting3 = document.getElementById('upcoming-session-play-3');
			playSetting3.classList.add("fa-play");
			playSetting3.classList.remove("fa-hourglass-start");
	
			//For mobile view
			var playSetting33 = document.getElementById('upcoming-session-play-33');
			playSetting33.classList.add("fa-play");
			playSetting33.classList.remove("fa-hourglass-start");
		} else {
			var playSetting3 = document.getElementById('upcoming-session-play-3');
			playSetting3.classList.add("fa-hourglass-start");
			playSetting3.classList.remove("fa-play");
			//For mobile view
			var playSetting33 = document.getElementById('upcoming-session-play-33');
			playSetting33.classList.add("fa-hourglass-start");
			playSetting33.classList.remove("fa-play");
		}
	
		if (isInRange4) {
			var playSetting4 = document.getElementById('upcoming-session-play-4');
			playSetting4.classList.add("fa-play");
			playSetting4.classList.remove("fa-hourglass-start");
	
			//For mobile view
			var playSetting44 = document.getElementById('upcoming-session-play-44');
			playSetting44.classList.add("fa-play");
			playSetting44.classList.remove("fa-hourglass-start");
		} else {
			var playSetting4 = document.getElementById('upcoming-session-play-4');
			playSetting4.classList.add("fa-hourglass-start");
			playSetting4.classList.remove("fa-play");
			//For mobile view
			var playSetting44 = document.getElementById('upcoming-session-play-44');
			playSetting44.classList.add("fa-hourglass-start");
			playSetting44.classList.remove("fa-play");
		}
	
		if (isInRange5) {
			var playSetting5 = document.getElementById('upcoming-session-play-5');
			playSetting5.classList.add("fa-play");
			playSetting5.classList.remove("fa-hourglass-start");
	
			//For mobile view
			var playSetting55 = document.getElementById('upcoming-session-play-55');
			playSetting55.classList.add("fa-play");
			playSetting55.classList.remove("fa-hourglass-start");
		} else {
			var playSetting5 = document.getElementById('upcoming-session-play-5');
			playSetting5.classList.add("fa-hourglass-start");
			playSetting5.classList.remove("fa-play");
			//For mobile view
			var playSetting55 = document.getElementById('upcoming-session-play-55');
			playSetting55.classList.add("fa-hourglass-start");
			playSetting55.classList.remove("fa-play");
		}
	

	

	//set value for upcoming sessions each value of time..

	for (var i = 0; i < fileList.length; i++) {
		var upcoming_time_elements = document.querySelectorAll(".upcoming_time_" + (i + 1));
		upcoming_time_elements.forEach(function (element) {


			// Your original datetime string
			let formattedTime = formatDateTime(fileList[i].savetime);
			// let savetime = fileList[i].savetime;

			// // Convert the string to a Date object
			// let date = new Date(savetime);

			// // Get the year, month, and day from the Date object
			// let year = date.getFullYear();
			// let month = String(date.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() returns 0-11
			// let day = String(date.getDate()).padStart(2, '0');

			// // Get the hours and convert it to a 12-hour format with AM/PM
			// let hours = date.getHours();
			// let ampm = hours >= 12 ? 'PM' : 'AM';
			// hours = hours % 12;
			// hours = hours ? hours : 12; // the hour '0' should be '12'

			// // Construct the new formatted date string
			// let formattedTime = `${year}-${month}-${day} ${hours}${ampm}`;



			// Check if the element is an input or textarea, if not, use textContent or innerHTML
			if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
				element.value = fileList[i].filename;

				element.textContent = formattedTime;

			} else {
				element.textContent = formattedTime;
				element.value = fileList[i].filename;
			}
		});
	}



	//Set the current date value below the music player
	currentDate = new Date(convert_local_time(new Date(), false, false));
	Years = currentDate.getFullYear();
	Month = currentDate.getMonth() + 1;
	Days = currentDate.getDate();

	const options = { month: 'short', day: 'numeric', hour: 'numeric', 'minute': 'numeric', 'second': 'numeric', hour12: true };
	let formattedTime = currentTime.toLocaleString('en-US', options);
	formattedTime = convert_local_time(new Date(), true);
	document.getElementById('localTime').innerText = 'Current time: ' + formattedTime;

	currentDate = Years + "-" + Month + "-" + Days + " ";
	var upcoming_current_date_display_elements = document.querySelectorAll(".upcoming-current-date");
	var arr_hours = [5, 8, 12, 16, 19];
	upcoming_current_date_display_elements.forEach(function (element, index) {
		// Check if the element is an input or textarea, if not, use textContent or innerHTML
		index = index % 5;
		if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
			element.value = currentDate;
		} else {
			element.textContent = formatDateTime(currentDate + " " + arr_hours[index] + ":00"); // or use element.innerHTML = dateString + " 8AM";
		}
	});

}

}


if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker
			.register("/scripts/serviceWorker.js")
			.then(res => console.log("service worker registered"))
			.catch(err => console.log("service worker not registered", err));
	});
}

  