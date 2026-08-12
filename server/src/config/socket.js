const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded; // { id, role, iat, exp }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: User ${socket.user.id}`);
    
    // Join a room specific to this user for targeted notifications
    socket.join(socket.user.id);
    
    // Optionally join a room based on role (e.g., 'NGO', 'VOLUNTEER', 'RESTAURANT', 'ADMIN')
    socket.join(`ROLE_${socket.user.role}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: User ${socket.user.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIo
};
