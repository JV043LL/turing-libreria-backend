// Error con codigo HTTP. Los services lo lanzan (throw) y el middleware
// de errores lo convierte en la respuesta JSON correspondiente.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
