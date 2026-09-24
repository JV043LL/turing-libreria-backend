const { Router } = require('express');
const controller = require('../controllers/books.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { listRules, createRules, updateRules, idRules } = require('../validators/books.validator');

const router = Router();

// Cada ruta encadena sus pasos en orden:
// autenticacion -> rol -> reglas de validacion -> validate -> controlador

// Publicas
router.get('/', listRules, validate, controller.getAll);
router.get('/:id', idRules, validate, controller.getById);

// Solo administradores
router.post('/', authenticate, authorize('admin'), createRules, validate, controller.create);
router.put('/:id', authenticate, authorize('admin'), updateRules, validate, controller.update);
router.delete('/:id', authenticate, authorize('admin'), idRules, validate, controller.remove);

module.exports = router;
