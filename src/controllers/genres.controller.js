const service = require('../services/genres.service');
const HttpError = require('../utils/httpError');

async function getAll(req, res) {
  res.json(await service.getAll());
}

async function getById(req, res) {
  const genre = await service.getById(req.params.id);
  if (!genre) throw new HttpError(404, 'Género no encontrado');
  res.json(genre);
}

module.exports = { getAll, getById };
