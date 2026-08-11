const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const { initSocket } = require('./src/config/socket');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Food Rescue API running on port ${PORT} in ${env.NODE_ENV} mode.`);
});
