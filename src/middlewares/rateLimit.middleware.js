const rateLimit = require('express-rate-limit');

const mensaje = (texto) => ({ error: texto });

// Limite general para toda la API: evita abusos y saturacion del servidor
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensaje('Demasiadas peticiones, intenta más tarde'),
});

// Limite estricto para login y registro: frena ataques de fuerza bruta a contraseñas
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  message: mensaje('Demasiados intentos, espera 15 minutos'),
});

module.exports = { apiLimiter, authLimiter };
