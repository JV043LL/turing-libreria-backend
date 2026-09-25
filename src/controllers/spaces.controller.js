const service = require('../services/spaces.service');
const HttpError = require('../utils/httpError');

async function getAll(req, res) {
  res.json(await service.getAll());
}

async function getById(req, res) {
  const space = await service.getById(req.params.id);
  if (!space) throw new HttpError(404, 'Espacio no encontrado');
  res.json(space);
}

module.exports = { getAll, getById };
