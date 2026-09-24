const { Router } = require('express');
const controller = require('../controllers/favorites.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { idParam } = require('../validators/common.validator');

const router = Router();

// Todas las rutas de favoritos requieren sesion (cualquier rol)
router.use(authenticate);

router.get('/', controller.getMine);
router.post('/:bookId', idParam('bookId'), validate, controller.add);
router.delete('/:bookId', idParam('bookId'), validate, controller.remove);

module.exports = router;
