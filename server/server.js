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
    }
};

//var httpsServer = https.createServer(serverConfig, handleRequest);
//httpsServer.listen(HTTPS_PORT, '0.0.0.0');
var httpServer = http.createServer(handleRequest);
httpServer.listen(THIS_PORT || 8443);

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
})*/


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

console.log('Server running. Visit http://localhost:' + THIS_PORT + ' in Firefox/Chrome!)');
