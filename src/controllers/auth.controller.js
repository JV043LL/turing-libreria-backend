const service = require('../services/auth.service');

async function register(req, res) {
  const { nombre, email, password } = req.body;
  const resultado = await service.register({ nombre, email, password });
  res.status(201).json(resultado);
}

async function login(req, res) {
  const { email, password } = req.body;
  res.json(await service.login({ email, password }));
}

// Perfil del usuario dueño del token
async function me(req, res) {
  res.json(await service.getProfile(req.user.id));
}

module.exports = { register, login, me };
