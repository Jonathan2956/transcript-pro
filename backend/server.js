/**
 * TranscriptPro - Main Server File
 * यह file application का main entry point है
 */

// Required modules import करें
const express = require('express'); // Express framework web server के लिए
const cors = require('cors'); // Cross-Origin Resource Sharing के लिए
const mongoose = require('mongoose'); // MongoDB के लिए ODM
const helmet = require('helmet'); // Security headers के लिए
const rateLimit = require('express-rate-limit'); // Rate limiting के लिए
require('dotenv').config(); // Environment variables load करने के लिए

// Express application create करें
const app = express();

// Security Middleware Setup
app.use(helmet()); // Security headers enable करें
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL allow करें
  credentials: true // Cookies और authentication allow करें
}));

// Rate Limiting Setup - API abuse prevent करने के लिए
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes का window
  max: 100 // हर IP से maximum 100 requests allow करें
});
app.use(limiter);

// Body Parsing Middleware - Request bodies parse करने के लिए
app.use(express.json({ limit: '10mb' })); // JSON data के लिए
app.use(express.urlencoded({ extended: true })); // URL encoded data के लिए

// MongoDB Atlas Connection Setup
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transcript-app', {
  useNewUrlParser: true, // New URL parser use करें
  useUnifiedTopology: true, // New server discovery engine use करें
})
.then(() => console.log('✅ MongoDB Connected Successfully')) // Success message
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err); // Error message
  process.exit(1); // Application exit करें error के साथ
});

// API Routes Setup
app.use('/api/auth', require('./routes/auth')); // Authentication routes
app.use('/api/transcripts', require('./routes/transcripts')); // Transcript routes
app.use('/api/vocabulary', require('./routes/vocabulary')); // Vocabulary routes
app.use('/api/progress', require('./routes/progress')); // Progress routes
app.use('/api/ai', require('./routes/ai')); // AI processing routes
app.use('/api/youtube', require('./routes/youtube')); // YouTube integration routes [NEW]

// Health Check Route - Server status check करने के लिए
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), // Current timestamp
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' // DB status
  });
});

// Error Handling Middleware - सभी errors handle करने के लिए
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack); // Error log करें
  res.status(500).json({ 
    error: 'Something went wrong!', // User-friendly error message
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message // Detailed message
  });
});

// 404 Handler - Unknown routes के लिए
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' }); // 404 error
});

// Server Start - Specific port पर server start करें
const PORT = process.env.PORT || 5000; // Environment port या default 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`); // Server start message
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`); // Environment info
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`); // Health check URL
});
