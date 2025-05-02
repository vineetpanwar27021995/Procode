require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { handleErrors } = require('./utils/errorHandler');
const { CORS, RATE_LIMIT } = require('./config/constants');

const app = express();

// Middleware
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ 
  origin: CORS.ALLOWED_ORIGINS,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/db', require('./routes/firestore.routes'));
app.use('/api/analyze', require('./routes/analyzeIntution.routes'));
app.use('/api/problems', require('./routes/problems.routes'));
app.use('/api/user', require('./routes/user.routes'));

app.get('/', (req, res) => {
  res.send('🚀 Hello from ProCode on GCP!');
});

app.get('/api/test', (req, res) => {
  res.json({
    message: '🎉 Hello from ProCode Backend!',
    status: 'success',
    time: new Date().toISOString(),
  });
});

app.use(handleErrors);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Backend server listening on port ${PORT}`);
});

module.exports = app;