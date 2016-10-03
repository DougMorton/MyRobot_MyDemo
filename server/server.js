// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection

var isUseHTTPs = !(!!process.env.PORT || !!process.env.IP);
isUseHTTPs = false;

var port = process.env.PORT || 9001;

try {
    var _port = require('./config.json').port;

    if (_port && _port.toString() !== '9001') {
        port = parseInt(_port);
    }
} catch (e) {}
//require(isUseHTTPs ? 'https' : 'http'),
var server = require(isUseHTTPs ? 'https' : 'http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
console.log(isUseHTTPs);
function serverHandler(request, response) {
    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);
    var stats;

    try {
        stats = fs.lstatSync(filename);
    } catch (e) {
        response.writeHead(404, {
            'Content-Type': 'text/plain'
        });
        response.write('404 Not Found: ' + path.join('/', uri) + '\n');
        response.end();
        return;
    }
    if (fs.statSync(filename).isDirectory()) {
        response.writeHead(404, {
            'Content-Type': 'text/html'
        });

        if (filename.indexOf('/demos/MultiRTC/') !== -1) {
            filename = filename.replace('/demos/MultiRTC/', '');
            filename += '/demos/MultiRTC/index2.html';
        } else if (filename.indexOf('/demos/') !== -1) {
            filename = filename.replace('/demos/', '');
            filename += '/demos/index.html';
        } else {
            filename += '/demos/index.html';
        }
    }

    fs.readFile(filename, 'utf8', function(err, file) {
        if (err) {
            response.writeHead(500, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + path.join('/', uri) + '\n');
            response.end();
            return;
        }

        try {
            var demos = (fs.readdirSync('demos') || []);

            if (demos.length) {
                var h2 = '<h2 style="text-align:center;display:block;"><a href="https://www.npmjs.com/package/rtcmulticonnection-v3"><img src="https://img.shields.io/npm/v/rtcmulticonnection-v3.svg"></a><a href="https://www.npmjs.com/package/rtcmulticonnection-v3"><img src="https://img.shields.io/npm/dm/rtcmulticonnection-v3.svg"></a><a href="https://travis-ci.org/muaz-khan/RTCMultiConnection"><img src="https://travis-ci.org/muaz-khan/RTCMultiConnection.png?branch=master"></a></h2>';
                var otherDemos = '<section class="experiment" id="demos"><details><summary style="text-align:center;">Check ' + (demos.length - 1) + ' other RTCMultiConnection-v3 demos</summary>' + h2 + '<ol>';
                demos.forEach(function(f) {
                    if (f && f !== 'index.html' && f.indexOf('.html') !== -1) {
                        otherDemos += '<li><a href="/demos/' + f + '">' + f + '</a> (<a href="https://github.com/muaz-khan/RTCMultiConnection/tree/master/demos/' + f + '">Source</a>)</li>';
                    }
                });
                otherDemos += '<ol></details></section><section class="experiment own-widgets latest-commits">';

                file = file.replace('<section class="experiment own-widgets latest-commits">', otherDemos);
            }
        } catch (e) {}

        try {
            var docs = (fs.readdirSync('docs') || []);

            if (docs.length) {
                var html = '<section class="experiment" id="docs">';
                html += '<h2><a href="#docs">Documentation</a></h2>';
                html += '<ol>';

                docs.forEach(function(f) {
                    html += '<li><a href="https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/' + f + '">' + f + '</a></li>';
                });

                html += '</ol></section><section class="experiment own-widgets latest-commits">';

                file = file.replace('<section class="experiment own-widgets latest-commits">', html);
            }
        } catch (e) {}

        response.writeHead(200);
        response.end(fs.readFileSync(filename));
        //response.write(file, 'utf-8');
        //response.end();
    });
}

var app;

if (isUseHTTPs) {
    var options = {
        key: fs.readFileSync(path.join(__dirname, 'ssl-keys/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl-keys/cert.pem'))
    };
    app = server.createServer(options, serverHandler);
} else app = server.createServer(serverHandler);

app = app.listen(port, process.env.IP || '0.0.0.0', function() {
    var addr = app.address();
    console.log('Server listening at', addr.address + ':' + addr.port);
});

require('./Signaling-Server.js')(app, function(socket) {
    try {
        var params = socket.handshake.query;

        // "socket" object is totally in your own hands!
        // do whatever you want!

        // in your HTML page, you can access socket as following:
        // connection.socketCustomEvent = 'custom-message';
        // var socket = connection.getSocket();
        // socket.emit(connection.socketCustomEvent, { test: true });

        if (!params.socketCustomEvent) {
            params.socketCustomEvent = 'custom-message';
        }

        socket.on(params.socketCustomEvent, function(message) {
            try {
                socket.broadcast.emit(params.socketCustomEvent, message);
            } catch (e) {}
        });
    } catch (e) {
    	console.log(e);
    }
});

/*
var fs = require('fs');
var http = require('http');
var WebSocketServer = require('ws').Server;
var THIS_PORT = process.env.PORT;

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);

    if(request.url == '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('Publisher.html'));
    } else if(request.url == '/webrtc.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('client/webrtc.js'));
    } else if(request.url == '/favicon.ico') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('favicon.ico'));
    } else {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync(request));
    }
};

//var httpsServer = https.createServer(serverConfig, handleRequest);
//httpsServer.listen(HTTPS_PORT, '0.0.0.0');
var httpServer = http.createServer(handleRequest);
httpServer.listen(THIS_PORT || 9001);

/*
httpServer.get('*',function(req,res,next) {
	if (request.headers['x-forwarded-proto'] != 'https') {
   		response.redirect ("https://" +
                 request.hostname +
                 THIS_PORT +
                 request.originalUrl );
        }
	else
		next()
})


// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpServer});

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        // Broadcast any received message to all clients
        console.log('received: %s', message);
        wss.broadcast(message);
    });
});

wss.broadcast = function(data) {
    for(var i in this.clients) {
        this.clients[i].send(data);
    }
};
*/
//console.log('Server running. Visit http://localhost:' + THIS_PORT + ' in Firefox/Chrome!)');
