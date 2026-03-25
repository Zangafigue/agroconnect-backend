const router = require('express').Router();
const ctrl = require('../controllers/news.controller');

router.get('/',     ctrl.getNews);
router.get('/:id',  ctrl.getNewsById);

module.exports = router;
