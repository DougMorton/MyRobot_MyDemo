function getElement(selector) {
    return document.querySelector(selector);
}

var main = getElement('.main');

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

function addTextMessage(args) {
    var textMessageDIV = document.getElementById("textMessages");
    textMessageDIV.innerHTML = textMessageDIV.innerHTML + "<div id=messageFrom>" + decodeURIComponent(args.username) + " : </div><div id=theMessage>" + args.message + "</div><br>";
}

function addNewMessage(args) {
    var newMessageDIV = document.getElementById("messages");
    newMessageDIV.innerHTML = args.message;
    console.log(newMessageDIV.innerHTML);
    if (args.callback) {
        args.callback(newMessageDIV);
    }
}
/*
main.querySelector('#room-name').value = localStorage.getItem('room-name') || (Math.random() * 1000).toString().replace('.', '');
if(localStorage.getItem('user-name')) {
    main.querySelector('#your-name').value = localStorage.getItem('user-name');
}*/
main.querySelector('#continue').onclick = function() {
    var yourName = document.querySelector('#your-name');
    var roomName = document.querySelector('#room-name');
    localStorage.setItem('room-name', roomName.innerText);
    localStorage.setItem('user-name', yourName.innerText);    
    var username = yourName.innerText || 'Anonymous';

    rtcMultiConnection.extra = {
        username: username,
        color: getRandomColor()
    };

    addNewMessage({
        header: username,
        message: 'Searching for existing rooms...',
        userinfo: '<img src="images/action-needed.png">'
    });

    rtcMultiConnection.close();
    var roomid = roomName.innerText;
    rtcMultiConnection.channel = roomid;
	rtcMultiConnection.leaveOnPageUnload = true;

	var firebaseRoomSocket = new Firebase(rtcMultiConnection.resources.firebaseio + rtcMultiConnection.channel + 'openjoinroom');

	firebaseRoomSocket.once('value', function (data) {
		var sessionDescription = data.val();
		console.log("sessionDescription",sessionDescription);
		// checking for room; if not available "open" otherwise "join"
		if (sessionDescription == null) {
            rtcMultiConnection.open({
                dontTransmit: true,
                sessionid: roomid
            });
			console.log("Open",rtcMultiConnection.channel,rtcMultiConnection.sessionid);			
			firebaseRoomSocket.set(rtcMultiConnection.sessionDescription);
					
			// if room owner leaves; remove room from the server
			firebaseRoomSocket.onDisconnect().remove();
		} else {
			addNewMessage({
                header: username,
                message: 'Room found. Joining the room...',
                userinfo: '<img src="images/action-needed.png">'
            });
            rtcMultiConnection.join(sessionDescription);
			console.log("Join",rtcMultiConnection.channel,sessionDescription);			
		}

		//console.debug('room is present?', sessionDescription == null);
	});
};
function getUserinfo(blobURL, imageURL) {
    return blobURL ? '<video src="' + blobURL + '" autoplay controls></video>' : '<img src="' + imageURL + '">';
}

var isShiftKeyPressed = false;

getElement('.main-input-box textarea').onkeydown = function(e) {
    if (e.keyCode == 16) {
        isShiftKeyPressed = true;
    }
};

var numberOfKeys = 0;
getElement('.main-input-box textarea').onkeyup = function(e) {
    numberOfKeys++;
    if (numberOfKeys > 3) numberOfKeys = 0;

    if (!numberOfKeys) {
        if (e.keyCode == 8) {
            return rtcMultiConnection.send({
                stoppedTyping: true
            });
        }

        rtcMultiConnection.send({
            typing: true
        });
    }

    if (isShiftKeyPressed) {
        if (e.keyCode == 16) {
            isShiftKeyPressed = false;
        }
        return;
    }

    if (e.keyCode != 13) return;
//linkify(
	addTextMessage({
        message: this.value,
        username: rtcMultiConnection.extra.username
	});
	
    rtcMultiConnection.send((this.value));

    this.value = '';
};

getElement('.allow-webcam-text').onclick = function() {
	showWebcam();
};

getElement('#allow-webcam').onclick = function() {
	showWebcam();
};

/*getElement('#webcam-no').onclick = function() {
	showWebcam();
};*/

function showWebcam() {
	var isWebcamMuted = document.querySelector('#isWebcamMuted');
	if (isWebcamMuted.innerText=="muted") {
        rtcMultiConnection.streams.unmute({
            video: true,
            type: 'local'
        });
	} else if (isWebcamMuted.innerText=="unmuted") {
        rtcMultiConnection.streams.mute({
            video: true,
            type: 'local'
        });
	} else if (isWebcamMuted.innerText=="") {
		var webcamBtn = document.querySelector('#allow-webcam');
		var session = { audio: true, video: true };
		rtcMultiConnection.captureUserMedia(function(stream) {
			var streamid = rtcMultiConnection.token();
			rtcMultiConnection.customStreams[streamid] = stream;
			rtcMultiConnection.sendMessage({
				hasCamera: true,
				streamid: streamid,
				session: session
			});
		}, session);
		isWebcamMuted.innerText="unmuted";
	}
}

getElement('#allow-mic').onclick = function() {
	handleMic();
};

getElement('#audio-no').onclick = function() {
	handleMic();
};

function handleMic() {
	var isAudioMuted = document.querySelector('#isAudioMuted');
	if (isAudioMuted.innerText=="muted") {
        rtcMultiConnection.streams.unmute({
            audio: true,
            type: 'local'
        });
	} else {
        rtcMultiConnection.streams.mute({
            audio: true,
            type: 'local'
        });
	}
    //this.disabled = true;
    var session = { audio: true };

    rtcMultiConnection.captureUserMedia(function(stream) {
        var streamid = rtcMultiConnection.token();
        rtcMultiConnection.customStreams[streamid] = stream;

        rtcMultiConnection.sendMessage({
            hasMic: true,
            streamid: streamid,
            session: session
        });
    }, session);
}
getElement('#allow-screen').onclick = function() {
    this.disabled = true;
    var session = { screen: true };

    rtcMultiConnection.captureUserMedia(function(stream) {
        var streamid = rtcMultiConnection.token();
        rtcMultiConnection.customStreams[streamid] = stream;

        rtcMultiConnection.sendMessage({
            hasScreen: true,
            streamid: streamid,
            session: session
        });
    }, session);
};

getElement('#share-files').onclick = function() {
    var file = document.createElement('input');
    file.type = 'file';

    file.onchange = function() {
        rtcMultiConnection.send(this.files[0]);
    };
    fireClickEvent(file);
};

function fireClickEvent(element) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    element.dispatchEvent(evt);
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}
