// Lee y valida las variables de entorno en un solo lugar.
// Si falta una variable obligatoria, el servidor no arranca y dice cual falta.
require('dotenv').config({ quiet: true });

const obligatorias = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const faltantes = obligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}. Revisa tu archivo .env`);
}

module.exports = {
  port: Number(process.env.PORT) || 9000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },
  // Origenes que pueden consumir la API (separados por coma). Por defecto, el frontend de Vite.
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim()),
};
