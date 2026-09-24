const { Router } = require('express');
const controller = require('../controllers/genres.controller');
const validate = require('../middlewares/validate.middleware');
const { idParam } = require('../validators/common.validator');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', idParam(), validate, controller.getById);

module.exports = router;
