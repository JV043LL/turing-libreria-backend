const { Router } = require('express');
const controller = require('../controllers/spaces.controller');
const validate = require('../middlewares/validate.middleware');
const { idParam } = require('../validators/common.validator');

const router = Router();

// Publicas: alimentan la seccion "Nuestro espacio" y su pagina de detalle
router.get('/', controller.getAll);
router.get('/:id', idParam(), validate, controller.getById);

module.exports = router;
