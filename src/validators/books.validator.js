const { body, query } = require('express-validator');
const { idParam } = require('./common.validator');

const ANIO_MAXIMO = new Date().getFullYear() + 1;

// Reglas de cada campo. "opcional" se usa en PUT, donde solo se envia lo que cambia.
function reglasLibro({ opcional }) {
  const campo = (nombre) => (opcional ? body(nombre).optional() : body(nombre));

  return [
    campo('titulo')
      .isString().withMessage('El título debe ser texto')
      .trim()
      .isLength({ min: 1, max: 200 }).withMessage('El título debe tener entre 1 y 200 caracteres'),
    body('sinopsis')
      .optional({ values: 'null' })
      .isString().withMessage('La sinopsis debe ser texto')
      .trim(),
    campo('precio')
      .isFloat({ min: 0, max: 99999999 }).withMessage('El precio debe ser un número mayor o igual a 0')
      .toFloat(),
    body('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0')
      .toInt(),
    campo('isbn')
      .isString().withMessage('El ISBN debe ser texto')
      .trim()
      .matches(/^(\d{9}[\dX]|\d{13})$/).withMessage('El ISBN debe tener 10 o 13 dígitos (sin guiones)'),
    body('portada_url')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('La portada debe ser una URL http(s)')
      .isLength({ max: 255 }).withMessage('La URL de la portada no puede tener más de 255 caracteres'),
    body('anio_publicacion')
      .optional({ values: 'null' })
      .isInt({ min: 1000, max: ANIO_MAXIMO }).withMessage(`El año debe estar entre 1000 y ${ANIO_MAXIMO}`)
      .toInt(),
    campo('genre_id')
      .isInt({ min: 1 }).withMessage('genre_id debe ser el id de un género')
      .toInt(),
    campo('author_id')
      .isInt({ min: 1 }).withMessage('author_id debe ser el id de un autor')
      .toInt(),
  ];
}

const listRules = [
  query('genre').optional().isInt({ min: 1 }).withMessage('genre debe ser el id numérico de un género').toInt(),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor o igual a 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit debe estar entre 1 y 50').toInt(),
];

const createRules = reglasLibro({ opcional: false });
const updateRules = [idParam(), ...reglasLibro({ opcional: true })];

module.exports = { listRules, createRules, updateRules, idRules: [idParam()] };
