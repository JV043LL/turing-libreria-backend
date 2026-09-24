const service = require('../services/books.service');

// Un id valido es un entero positivo
function esIdValido(valor) {
  return /^[1-9]\d*$/.test(String(valor));
}

async function getAll(req, res) {
  try {
    const { genre, page, limit } = req.query;

    if (genre !== undefined && !esIdValido(genre)) {
      return res.status(400).json({ error: 'El parámetro genre debe ser el id numérico de un género' });
    }

    const resultado = await service.getAll({ genreId: genre, page, limit });
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
    }

    const book = await service.getById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    // req.user lo llenara el middleware de autenticacion (JWT); mientras tanto queda en null
    const userId = req.user?.id ?? null;
    const book = await service.create(req.body, userId);
    res.status(201).json(book);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
    }

    const book = await service.update(req.params.id, req.body);
    if (!book) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(book);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
    }

    const deleted = await service.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json({ message: 'Libro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove };
