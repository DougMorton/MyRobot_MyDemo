// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Experiments       - github.com/muaz-khan/WebRTC-Experiment

var rtcMultiConnection = new RTCMultiConnection();
var containerCt = 1;
var webcamBtn = document.querySelector('#allow-webcam');
var isWebcamMuted = document.querySelector('#isWebcamMuted');
var isWebcamNo = document.querySelector('#webcam-no');
var isAudioMuted = document.querySelector('#isAudioMuted');
var isAudioNo = document.querySelector('#audio-no');

rtcMultiConnection.session = { data: true };

rtcMultiConnection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

// http://www.rtcmulticonnection.org/docs/openSignalingChannel/
var firebaseSignalingSocket = new Firebase(rtcMultiConnection.resources.firebaseio + rtcMultiConnection.channel);

var onMessageCallbacks = {};

firebaseSignalingSocket.on('child_added', function (snap) {
    onMessageCallBack(snap.val());
    snap.ref().remove(); // for socket.io live behaviour
});

function onMessageCallBack(data) {
    data = JSON.parse(data);

    if (data.sender == rtcMultiConnection.userid) return;

    if (onMessageCallbacks[data.channel]) {
        onMessageCallbacks[data.channel](data.message);
    };
}

rtcMultiConnection.openSignalingChannel = function (config) {
    var channel = config.channel || this.channel;
    onMessageCallbacks[channel] = config.onmessage;
console.log("openSignalingChannel",rtcMultiConnection.userid,config,channel);
    if (config.onopen) setTimeout(config.onopen, 1000);
    return {
        send: function (message) {
            firebaseSignalingSocket.push(JSON.stringify({
                sender: rtcMultiConnection.userid,
                channel: channel,
                message: message
            }));
        },
        channel: channel
    };
};

rtcMultiConnection.customStreams = { };

/*
// http://www.rtcmulticonnection.org/docs/fakeDataChannels/
rtcMultiConnection.fakeDataChannels = true;
if(rtcMultiConnection.UA.Firefox) {
rtcMultiConnection.session.data = true;
}
*/

rtcMultiConnection.autoTranslateText = false;

rtcMultiConnection.onopen = function(e) {
console.log("onopen",e);
    getElement('#allow-webcam').disabled = false;
    getElement('#allow-mic').disabled = false;
    getElement('#share-files').disabled = false;
    getElement('#allow-screen').disabled = false;

    addNewMessage({
        header: e.extra.username,
        message: 'Data connection is opened between you and ' + e.extra.username + '.',
        userinfo: getUserinfo(rtcMultiConnection.blobURLs[rtcMultiConnection.userid], 'images/info.png'),
        color: e.extra.color
    });

    numbersOfUsers.innerHTML = parseInt(numbersOfUsers.innerHTML) + 1;
	var redbutton = document.querySelector('#redbutton');
	if (redbutton) {
		redbutton.style.display="inline";
		redbutton.style.verticalAlign="top";
		}
	var user = document.querySelector('#your-name').innerText;
	var room = document.querySelector('#room-name').innerText;
	room = parseInt(room);
	var liveMessage = document.querySelector('#liveMessage');
	if (liveMessage) {
		liveMessage.innerHTML = "&nbsp;&nbsp;" + e.extra.username + " is on-line.  <br><a target='_new' href='LawChat.html?r=" + room + "&u=" + user + "'><img border=1 src='images/click-to-chat.png'></a>";
		liveMessage.style.display="table-cell";
		liveMessage.style.verticalAlign="bottom";
		}
	var redBtn = document.querySelector('#divRedButton');
	redBtn.style.display = "block";
};


var whoIsTyping = document.querySelector('#who-is-typing');
rtcMultiConnection.onmessage = function(e) {
console.log("onmessage",e);
    if (e.data.typing) {
        whoIsTyping.innerHTML = e.extra.username + ' is typing ...';
        return;
    }

    if (e.data.stoppedTyping) {
        whoIsTyping.innerHTML = '';
        return;
    }

    whoIsTyping.innerHTML = '';

    addTextMessage({
        message: e.data,
        username: e.extra.username
	});
};

var sessions = { };
rtcMultiConnection.onNewSession = function(session) {
    if (sessions[session.sessionid]) return;
    sessions[session.sessionid] = session;

    session.join();

    addNewMessage({
        header: session.extra.username,
        message: 'Making handshake with room owner....!',
        userinfo: '<img src="images/action-needed.png">',
        color: session.extra.color
    });
};

rtcMultiConnection.onRequest = function(request) {
    rtcMultiConnection.accept(request);
    addNewMessage({
        header: 'New Participant',
        message: 'Participants found. Accepting request of ' + request.extra.username + ' ( ' + request.userid + ' )...',
        userinfo: '<img src="images/action-needed.png">',
        color: request.extra.color
    });
};

rtcMultiConnection.onCustomMessage = function(message) {
    if (message.hasCamera || message.hasScreen) {
        var msg = message.extra.username + ' enabled webcam.'
        // <button id="preview">Preview</button> ---- <button id="share-your-cam">Share Your Webcam</button>';

        if (message.hasScreen) {
            msg = message.extra.username + ' is sharing their screen.';
            // <button id="share-your-cam">Share Your Screen</button>'
        }

        addNewMessage({
            header: message.extra.username,
            message: msg,
            userinfo: '<img src="images/action-needed.png">',
            color: message.extra.color,
            callback: function(div) {
				this.disabled = true;

				message.session.oneway = true;
				rtcMultiConnection.sendMessage({
					renegotiate: true,
					streamid: message.streamid,
					session: message.session
				});
            }
        });
    }

    if (message.hasMic) {
        addNewMessage({
            header: message.extra.username,
            message: message.extra.username + ' enabled microphone.',
            userinfo: '<img src="images/action-needed.png">',
            color: message.extra.color,
            callback: function(div) {
                div.querySelector('#listen').onclick = function() {
                    this.disabled = true;
                    message.session.oneway = true;
                    rtcMultiConnection.sendMessage({
                        renegotiate: true,
                        streamid: message.streamid,
                        session: message.session
                    });
                };

                div.querySelector('#share-your-mic').onclick = function() {
                    this.disabled = true;

                    var session = { audio: true };

                    rtcMultiConnection.captureUserMedia(function(stream) {
                        rtcMultiConnection.renegotiatedSessions[JSON.stringify(session)] = {
                            session: session,
                            stream: stream
                        }
                        
                        rtcMultiConnection.peers[message.userid].peer.connection.addStream(stream);
                        div.querySelector('#listen').onclick();
                    }, session);
                };
            }
        });
    }

    if (message.renegotiate) {
        var customStream = rtcMultiConnection.customStreams[message.streamid];
        if (customStream) {
            rtcMultiConnection.peers[message.userid].renegotiate(customStream, message.session);
        }
    }
};

function getCount(parent, getChildrensChildren){
    var relevantChildren = 0;
    var children = parent.childNodes.length;
    for(var i=0; i < children; i++){
        if(parent.childNodes[i].nodeType != 3){
            if(getChildrensChildren)
                relevantChildren += getCount(parent.childNodes[i],true);
            relevantChildren++;
        }
    }
    return relevantChildren;
}

rtcMultiConnection.blobURLs = { };
rtcMultiConnection.onstream = function(e) {
console.log("onstream",e);
	if (e.isScreen) {
    	var div = document.getElementById("dialog-popup");
    	div.appendChild(e.mediaElement);
      	$("#dialog-popup" ).dialog({
    		autoOpen: false,
    		width: 800
  		});
    	$("#dialog-popup").dialog('open');
    	div.style.display = 'block';
    } else if (e.stream.getVideoTracks().length) {
        rtcMultiConnection.blobURLs[e.userid] = e.blobURL;
        /*
        if( document.getElementById(e.userid) ) {
            document.getElementById(e.userid).muted = true;
        }
        */

        addNewMessage({
            header: e.extra.username,
            message: e.extra.username + ' enabled webcam.',
            //userinfo: '<video id="' + e.userid + '" src="' + URL.createObjectURL(e.stream) + '" autoplay muted=true volume=0></vide>',
            color: e.extra.color
        });
    	var holder = document.getElementById("holder");
    	var vid = document.getElementById('divVideo');
    	//dim ct = getCount(vid,true);
    	if (vid.childNodes.length==0) {
    	//var vid = document.createElement('div');
    	//vid.id = e.streamid;
    	//vid.id = "divVideo";
    	vid.style.margin = "0 0 0 0";
    	vid.style.overflow="hidden";
    	vid.style.display="block";
    	vid.style.borderRadius="0px";
    	vid.style.position="relative";
    	//vid.style.float="left";
    	/*
		if (containerCt==1) {
    		vid.width="100%";
    		vid.height="100%";
		} else {
			var i;
			for (i==0;i<containerCt;i++) {
				$(holder.children[i]).width("50%");
			}
		}
		*/
		/*
		if (containerCt==2) {
			var vid1 = holder.children[0];
			$(holder.children[0]).width("50%");
			$(vid).width("50%");
		}
		if (containerCt==3) {
			$(holder.children[0]).width("33%");
			$(holder.children[1]).width("33%");
			$(vid).width("33%");
		}
		if (containerCt==4) {
			$(holder.children[0]).width("45%");
			$(holder.children[1]).width("45%");
			$(holder.children[2]).width("45%");
			$(vid).width("45%");
		}*/

		var n = document.createElement('div');
		n.innerText = e.extra.username;
		n.style.color="tan";
		n.style.fontSize="16pt";
		n.style.fontWeight="bold";
		n.style.position="absolute";
		n.style.paddingLeft="3px";
		n.zindex=100;
		n.top=0;
		n.left=0;
		//vid.appendChild(n);
		
		var takeSnapshot = document.createElement('button');
		takeSnapshot.className = 'takeSnapshot';
		takeSnapshot.title = 'Take snapshot of this video';

		takeSnapshot.onclick = function() {
			rtcMultiConnection.streams[rtcMultiConnection.localStreamids].takeSnapshot(function(snapshot) {
				var image = new Image();
				image.src = snapshot;
				var div = document.getElementById("dialog-popup");
				div.appendChild(image);
				$("#dialog-popup" ).dialog({
					autoOpen: false,
					width: 800
				});
				$("#dialog-popup").dialog('open');
				div.style.display = 'block';
			});
		};
		//var width = parseInt(document.getElementById("holder").clientWidth / 2) - 20;
		var width = parseInt(document.getElementById("holder").clientWidth);
		var height = parseInt(document.getElementById("holder").clientHeight);
		//var height = parseInt(document.getElementById("holder").clientHeight / 2);
		height = 400;
		width = 600;
		var v = getMediaElement(e.mediaElement, {
			buttons: ['mute-audio', 'mute-video', 'record-audio', 'record-video', 'full-screen', 'volume-slider', 'stop'],
			width: width,
			height: height,
			//height: 300,
			showOnMouseEnter: true
		});
		//vid.appendChild(takeSnapshot);
		vid.appendChild(v);
		holder.appendChild(vid);
		setTimeout(function() {
			holder.style.visility="visible";
        	document.getElementById("imgPlaceholder").style.display="none";
			v.media.play();
		}, 500);
		}
    } else {
        addNewMessage({
            header: e.extra.username,
            message: e.extra.username + ' enabled microphone.',
            userinfo: '<audio src="' + URL.createObjectURL(e.stream) + '" controls muted=true volume=0></vide>',
            color: e.extra.color
        });
    }
};

rtcMultiConnection.sendMessage = function(message) {
    message.userid = rtcMultiConnection.userid;
    message.extra = rtcMultiConnection.extra;
    rtcMultiConnection.sendCustomMessage(message);
};

rtcMultiConnection.onclose = rtcMultiConnection.onleave = function(event) {
    addNewMessage({
        header: event.extra.username,
        message: event.extra.username + ' left the room.',
        userinfo: getUserinfo(rtcMultiConnection.blobURLs[event.userid], 'images/info.png'),
        color: event.extra.color
    });
	var redbutton = document.querySelector('#redbutton');
	redbutton.style.display="none";
	var liveMessage = document.querySelector('#liveMessage');
	liveMessage.innerHTML = event.extra.username + " is off-line.";
	liveMessage.style.display="table-cell";
};
rtcMultiConnection.onmute = function(e) {
if (e.isAudio) {
    isAudioNo.style.display="block";
    isAudioMuted.innerText="muted";
	addNewMessage({
		header: e.extra.username,
		message: e.extra.username + ' muted audio.',
	});
} else {
    e.mediaElement.setAttribute('poster', '//www.webrtc-experiment.com/images/muted.png');
    isWebcamNo.style.display="block";
    isWebcamMuted.innerText="muted";
	addNewMessage({
		header: e.extra.username,
		message: e.extra.username + ' stopped webcam.',
	});
}
};

rtcMultiConnection.onunmute = function(e) {
if (e.isAudio) {
    isAudioNo.style.display="none";
    isAudioMuted.innerText="unmuted";
	addNewMessage({
		header: e.extra.username,
		message: e.extra.username + ' unmuted audio.',
	});
} else {
    e.mediaElement.removeAttribute('poster');
    isWebcamNo.style.display="none";
    isWebcamMuted.innerText="unmuted";
	addNewMessage({
		header: e.extra.username,
		message: e.extra.username + ' started webcam.',
	});
}
};

