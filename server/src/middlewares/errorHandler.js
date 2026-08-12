const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  if (env.NODE_ENV === 'test') {
    console.error('Test Error:', err);
  }
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
