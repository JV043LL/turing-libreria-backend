const service = require('../services/genres.service');

async function getAll(req, res) {
  try {
    const genres = await service.getAll();
    res.json(genres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
    }

    const genre = await service.getById(req.params.id);
    if (!genre) return res.status(404).json({ error: 'Género no encontrado' });
    res.json(genre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById };
