const service = require('../services/favorites.service');
const HttpError = require('../utils/httpError');

async function getMine(req, res) {
  res.json(await service.getByUser(req.user.id));
}

async function add(req, res) {
  const { creado } = await service.add(req.user.id, req.params.bookId);
  // 201 si se agrego, 200 si ya estaba en favoritos
  res.status(creado ? 201 : 200).json({ message: creado ? 'Libro agregado a favoritos' : 'El libro ya estaba en favoritos' });
}

async function remove(req, res) {
  const eliminado = await service.remove(req.user.id, req.params.bookId);
  if (!eliminado) throw new HttpError(404, 'El libro no está en tus favoritos');
  res.json({ message: 'Libro eliminado de favoritos' });
}

module.exports = { getMine, add, remove };
