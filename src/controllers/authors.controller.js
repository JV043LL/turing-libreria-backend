const service = require('../services/authors.service');
const HttpError = require('../utils/httpError');

async function getAll(req, res) {
  res.json(await service.getAll());
}

async function getById(req, res) {
  const author = await service.getById(req.params.id);
  if (!author) throw new HttpError(404, 'Autor no encontrado');
  res.json(author);
}

module.exports = { getAll, getById };
