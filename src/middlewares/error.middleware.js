const HttpError = require('../utils/httpError');

// Errores de MySQL que se traducen a mensajes claros para el cliente
const ERRORES_MYSQL = {
  ER_DUP_ENTRY: [409, 'Ya existe un registro con ese valor (por ejemplo, ISBN o email repetido)'],
  ER_NO_REFERENCED_ROW_2: [400, 'El género, autor o libro indicado no existe'],
  ER_ROW_IS_REFERENCED_2: [409, 'No se puede eliminar porque otros registros dependen de él'],
  ER_CHECK_CONSTRAINT_VIOLATED: [400, 'Los datos no cumplen las reglas de la base de datos'],
  ER_CONSTRAINT_FAILED: [400, 'Los datos no cumplen las reglas de la base de datos'], // equivalente en MariaDB
};

// Se ejecuta cuando ninguna ruta coincide con la peticion
function notFound(req, res, next) {
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// Middleware de errores: Express lo reconoce porque recibe 4 parametros.
// En Express 5 los errores de funciones async llegan aqui automaticamente.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }

  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.details) body.detalles = err.details;
    return res.status(err.status).json(body);
  }

  if (ERRORES_MYSQL[err.code]) {
    const [status, mensaje] = ERRORES_MYSQL[err.code];
    return res.status(status).json({ error: mensaje });
  }

  // Error inesperado: se registra en consola pero no se exponen detalles internos al cliente
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
