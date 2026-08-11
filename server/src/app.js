const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const createError = require('http-errors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Request Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan('dev'));

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, 'Endpoint not found'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
