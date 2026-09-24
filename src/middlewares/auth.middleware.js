const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const HttpError = require('../utils/httpError');

// Verifica el token JWT del header "Authorization: Bearer <token>"
// y guarda los datos del usuario en req.user para los siguientes pasos.
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Se requiere iniciar sesión'));
  }

  try {
    const payload = jwt.verify(token, jwtConfig.secret);
    req.user = { id: payload.sub, rol: payload.rol };
    next();
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError' ? 'La sesión expiró, inicia sesión de nuevo' : 'Token inválido';
    next(new HttpError(401, mensaje));
  }
}

// Permite el paso solo a los roles indicados. Se usa despues de authenticate.
// Ejemplo: router.post('/', authenticate, authorize('admin'), controller.create)
function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return next(new HttpError(403, 'No tienes permisos para realizar esta acción'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
