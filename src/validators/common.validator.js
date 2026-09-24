const { param } = require('express-validator');

// Valida que un parametro de la URL (por ejemplo :id) sea un entero positivo
const idParam = (nombre = 'id') =>
  param(nombre).isInt({ min: 1 }).withMessage(`${nombre} debe ser un número entero positivo`).toInt();

module.exports = { idParam };
