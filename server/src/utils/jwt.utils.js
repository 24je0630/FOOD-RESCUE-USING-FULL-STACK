const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
