const { validationResult } = require('express-validator');
const HttpError = require('../utils/httpError');

// Se coloca despues de las reglas de express-validator.
// Si alguna regla fallo, responde 400 con la lista de errores por campo.
function validate(req, res, next) {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    const detalles = errores.array().map((e) => ({ campo: e.path, mensaje: e.msg }));
    return next(new HttpError(400, 'Datos inválidos', detalles));
  }

  next();
}

module.exports = validate;
