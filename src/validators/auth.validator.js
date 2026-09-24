const { body } = require('express-validator');

const registerRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('El email no es válido')
    .isLength({ max: 150 }).withMessage('El email no puede tener más de 150 caracteres'),
  body('password')
    .isString().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres') // 72 = limite de bcrypt
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
];

const loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('El email no es válido'),
  body('password').isString().notEmpty().withMessage('La contraseña es obligatoria'),
];

module.exports = { registerRules, loginRules };
