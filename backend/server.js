// server.js - Main application entry point

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const i18next = require('i18next');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware - addressing lessons about platform integrity
app.use(helmet()); // Set security headers
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/participatory-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Internationalization setup - critical for accessibility
i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: require('./locales/en.json'),
    es: require('./locales/es.json'),
    fr: require('./locales/fr.json')
    // Additional languages would be added here
  }
});

// Passport configuration for authentication
require('./config/passport')(passport);
app.use(passport.initialize());

// Modular routes - following the lessons about modularity and feature independence
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/processes', require('./routes/processes.routes'));
app.use('/api/proposals', require('./routes/proposals.routes'));
app.use('/api/voting', require('./routes/voting.routes'));
app.use('/api/deliberation', require('./routes/deliberation.routes'));
app.use('/api/budgeting', require('./routes/budgeting.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
