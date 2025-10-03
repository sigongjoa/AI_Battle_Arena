const { PeerServer } = require('peer');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all origins

const peerServer = PeerServer({
  port: 9000,
  path: '/myapp',
  allow_discovery: true,
  app: app // Pass the Express app to PeerServer
});

console.log('Custom PeerServer started on port 9000 with path /myapp');