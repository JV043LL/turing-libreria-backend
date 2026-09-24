const { Router } = require('express');
const controller = require('../controllers/genres.controller');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);

module.exports = router;
