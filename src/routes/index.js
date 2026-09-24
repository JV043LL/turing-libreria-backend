const { Router } = require('express');

const router = Router();

// Endpoint de salud: sirve para comprobar que la API esta arriba (util al desplegar)
router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/auth', require('./auth.routes'));
router.use('/books', require('./books.routes'));
router.use('/genres', require('./genres.routes'));
router.use('/authors', require('./authors.routes'));
router.use('/favorites', require('./favorites.routes'));

module.exports = router;
