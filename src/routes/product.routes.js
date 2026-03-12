const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const { requireCanSell }= require('../middleware/canSell.middleware');
const { requireVerified}= require('../middleware/isVerified.middleware');
const ctrl = require('../controllers/product.controller');

router.get('/',              ctrl.getCatalog);
router.get('/my/products',   verifyToken, requireCanSell, ctrl.getMyProducts);
router.get('/:id',           ctrl.getProductById);
router.post('/',             verifyToken, requireCanSell, requireVerified, ctrl.createProduct);
router.put('/:id',           verifyToken, ctrl.updateProduct);
router.delete('/:id',        verifyToken, ctrl.deleteProduct);
router.patch('/:id/toggle',  verifyToken, ctrl.toggleAvailability);

module.exports = router;
