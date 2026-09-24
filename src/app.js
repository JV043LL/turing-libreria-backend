// Configuracion de Express: middlewares globales, rutas y manejo de errores.
// Esta separado de server.js para poder probar la app sin levantar el servidor.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigins } = require('./config/env');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const routes = require('./routes');

const app = express();

// 1. Seguridad
app.use(helmet()); // cabeceras HTTP seguras
app.use(cors({ origin: corsOrigins })); // solo el frontend configurado puede consumir la API
app.use('/api', apiLimiter); // limite general de peticiones

// 2. Lectura del body en JSON (con limite de tamaño)
app.use(express.json({ limit: '100kb' }));

// 3. Rutas
app.use('/api', routes);

// 4. Errores: siempre al final
app.use(notFound);
app.use(errorHandler);

module.exports = app;
