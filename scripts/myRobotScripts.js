
function js_load (url, callback)
{
 console.log ("js_load:", url);
 
 var head = document.querySelector ("head");
 var script = document.createElement ("script");
 script.src = url;

 if (callback)
  script.onload = callback;

 head.appendChild (script);
}

//js_load("//cdn.webrtc-experiment.com/RTCMultiConnection.js");
//js_load("//cdn.webrtc-experiment.com/firebase.js");

var fileref = document.createElement("link")
fileref.setAttribute("rel", "stylesheet")
fileref.setAttribute("type", "text/css")
fileref.setAttribute("th:href", "@{style/style.css}")
fileref.setAttribute("href", "style/style.css")
document.getElementsByTagName("head")[0].appendChild(fileref)

setTimeout(function() {

	var userName = "Attorney";
	var roomID = "12961266234170221";
	var newRoomID = "12961266234170219";
	
	channelid = roomID;

	function getUrlVars() {
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
		});
	return vars;
	}

	var userName = getUrlVars()["u"];
	var roomID = getUrlVars()["r"];
	
	if (roomID === undefined) { roomID = "12961266234170221"; }
	if (userName === undefined) { userName = "Attorney" }
	//if (user == "Client") { userName = "Client" } else { userName = "Attorney" }
	
	var rtcMultiConnection = new RTCMultiConnection();
	
    rtcMultiConnection.socketURL = '/';

	rtcMultiConnection.enableFileSharing = true; // by default, it is "false".

	rtcMultiConnection.session = {
		audio: false,
		video: false,
		data: true
	};

	rtcMultiConnection.sdpConstraints.mandatory = {
		OfferToReceiveAudio: true,
		OfferToReceiveVideo: true
	};

	if(!rtcMultiConnection.socket) rtcMultiConnection.connectSocket();

	rtcMultiConnection.socket.on('common-among-all-pages', function(message) {
		console.log("socket-on");
		console.log(message);
	});
	
	rtcMultiConnection.open('admin-room-id', function() {
	console.log("open");
		rtcMultiConnection.setCustomSocketEvent('common-among-all-pages');
		rtcMultiConnection.socket.on('common-among-all-pages', function(message) {
			console.log('socket-on-common',message);
		});
	});
	
	rtcMultiConnection.onstream = function(e) {
		console.log("onstream",e);
	}

	rtcMultiConnection.onnewsession = function(e) {
		console.log("onnewsession",e);
	}
	
	rtcMultiConnection.zonNewParticipant = function(participantId, userPreferences) {
	console.log("onNewParticipant",participantId,userPreferences,rtcMultiConnection);
		if(rtcMultiConnection.userid === rtcMultiConnection.adminId && !rtcMultiConnection.extra.adminBusy) {
			rtcMultiConnection.connectedGuestId = participantId;
			rtcMultiConnection.extra.adminBusy = true;
			rtcMultiConnection.updateExtraData();

			rtcMultiConnection.acceptParticipationRequest(participantId, userPreferences);
		}
		jsShowDiv(participantId, userPreferences.connectionDescription.extra.username)
    };

	rtcMultiConnection.onstream = function(e) {
		console.log("onstream",e);
		jsShowDiv(e.userid, e.extra.username)
	};

	rtcMultiConnection.onopen = function(e) {
		console.log("onopen",e);
		if(rtcMultiConnection.userid === rtcMultiConnection.adminId && !rtcMultiConnection.extra.adminBusy) {
			rtcMultiConnection.connectedGuestId = participantId;
			rtcMultiConnection.extra.adminBusy = true;
			rtcMultiConnection.updateExtraData();

			rtcMultiConnection.acceptParticipationRequest(participantId, userPreferences);
		}
		jsShowDiv(e.userid, e.extra.username)
	};
	function jsShowDiv(participantId, username) {
		console.log("username",username,participantId);
		var div = document.getElementById("div_" + participantId);
		div.style.display="inline-block";
		div.style.cssFloat="left";
		div.style.tableAlign="top";
		div.style.paddingLeft="30px";
		div.style.border="0px solid black";
		div.style.width="220px";
		div.setAttribute("onclick","javascript:openChannels(" + newRoomID + ",'" + username + "')");
		var img = new Image(40,40); 
		img.id = "redbutton_" + participantId;
		img.src = "images/redbutton.gif";
		//img.style.display="none";
		img.style.verticalAlign="middle";
		var redbutton = document.querySelector('#redbutton_' + participantId);
		if (redbutton) {
			redbutton.style.display="inline-block";
			redbutton.style.verticalAlign="top";
			redbutton.style.float="left";
		}
		if (!document.getElementById("liveMessage_" + participantId)) {
		var spn = document.createElement('span');
		spn.appendChild(img);
		spn.id = "liveMessage_" + participantId;
		spn.style.border="0px solid black";
		//var newRoomID = 2345;
		var liveMessage = document.createElement("span");
		if (liveMessage) {
			liveMessage.innerHTML = "<font color=red>" + username + " is on-line.</font><br><img border=0 src='images/click-to-chat.png'>";
			liveMessage.style.display="inline-block";
			liveMessage.style.verticalAlign="bottom";
			liveMessage.style.textAlign="right";
			liveMessage.style.float="left";
		}
		spn.appendChild(liveMessage);
		div.appendChild(spn);
		}
		div.style.visibility="visible";
	}
	rtcMultiConnection.onclose = rtcMultiConnection.onleave = function(event) {
		var redbutton = document.querySelector('#redbutton');
		redbutton.style.display="none";
		var liveMessage = document.querySelector('#liveMessage');
		liveMessage.innerHTML = event.extra.username + " is off-line.";
		liveMessage.style.display="table-cell";
	};
	
	setTimeout(function() {
	

/*
		rtcMultiConnection.extra = {
			username: userName,
		};
	    rtcMultiConnection.close();
	    roomID = 'common-among-all-pages';
	    
		rtcMultiConnection.channel = roomID;
		//rtcMultiConnection.channel = "12961266234170220";
		//rtcMultiConnection.leaveOnPageUnload = true;
		var firebaseRoomSocket = new Firebase(rtcMultiConnection.resources.firebaseio + rtcMultiConnection.channel + 'openjoinroom');

		firebaseRoomSocket.once('value', function (data) {
			var sessionDescription = data.val();
			console.log("ZZZ",roomID,sessionDescription);
			if (sessionDescription == null) {
				rtcMultiConnection.open({
					dontTransmit: true,
					sessionid: roomID
				});
				rtcMultiConnection.session = {
					video: true,
					audio: false,
				};
				firebaseRoomSocket.set(rtcMultiConnection.sessionDescription);
				console.log("OPEN");
				firebaseRoomSocket.onDisconnect().remove();
			} else {
				console.log("JOIN",sessionDescription.session);
				sessionDescription.session = {
					video: true,
					audio: false,
				};
				rtcMultiConnection.join(sessionDescription);
			}
		});*/
		/*
		rtcMultiConnection.channel = "12961266234170221";
		firebaseRoomSocket = new Firebase(rtcMultiConnection.resources.firebaseio + rtcMultiConnection.channel + 'openjoinroom');
		firebaseRoomSocket.once('value', function (data) {
			var sessionDescription = data.val();
			console.log("ZZZ2",roomID,sessionDescription);
			if (sessionDescription == null) {
				rtcMultiConnection.open({
					dontTransmit: true,
					sessionid: roomID
				});
				rtcMultiConnection.session = {
					video: true,
					audio: false,
				};
				firebaseRoomSocket.set(rtcMultiConnection.sessionDescription);
				console.log("OPEN");
				firebaseRoomSocket.onDisconnect().remove();
			} else {
				console.log("JOIN",sessionDescription.session);
				sessionDescription.session = {
					video: true,
					audio: false,
				};
				rtcMultiConnection.join(sessionDescription);
			}
		});
		*/
	}, 10);
	
/*	rtcMultiConnection.streams.mute({
		audio: true,
		video: true
	});	*/	


}, 10);
