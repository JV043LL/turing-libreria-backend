const { matchedData } = require('express-validator');
const service = require('../services/books.service');
const HttpError = require('../utils/httpError');

// Nota: en Express 5, si una funcion async lanza un error, Express lo envia
// automaticamente al middleware de errores. Por eso no se usa try/catch aqui.

async function getAll(req, res) {
  // matchedData devuelve los query params ya validados y convertidos a numero
  const { genre, page, limit } = matchedData(req, { locations: ['query'] });
  const resultado = await service.getAll({ genreId: genre, page, limit });
  res.json(resultado);
}

async function getById(req, res) {
  const book = await service.getById(req.params.id);
  if (!book) throw new HttpError(404, 'Libro no encontrado');
  res.json(book);
}

async function create(req, res) {
  // req.user lo agrega el middleware authenticate a partir del token
  const book = await service.create(req.body, req.user.id);
  res.status(201).json(book);
}

async function update(req, res) {
  const book = await service.update(req.params.id, req.body);
  if (!book) throw new HttpError(404, 'Libro no encontrado');
  res.json(book);
}

async function remove(req, res) {
  const deleted = await service.remove(req.params.id);
  if (!deleted) throw new HttpError(404, 'Libro no encontrado');
  res.json({ message: 'Libro eliminado' });
}

module.exports = { getAll, getById, create, update, remove };
