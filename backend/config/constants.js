module.exports = {
    JWT: {
      SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
      EXPIRES_IN: '7d'
    },
    EMAIL_VERIFICATION: {
      TOKEN_EXPIRES_IN: '24h',
      TOKEN_SECRET: process.env.EMAIL_VERIFICATION_SECRET || 'your-email-verification-secret'
    },
    CORS: {
      ALLOWED_ORIGINS: [
        "http://localhost:3000",
        "https://procode-silk.vercel.app"
      ]
    },
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, 
      MAX: 100
    }
};