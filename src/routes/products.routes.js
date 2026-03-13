const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/product.controller');

router.get('/',      ctrl.getCatalog);
router.get('/:id',   ctrl.getProductById);

router.post('/',     verifyToken, requireRole(['FARMER', 'ADMIN']), ctrl.createProduct);
router.put('/:id',    verifyToken, requireRole(['FARMER', 'ADMIN']), ctrl.updateProduct);
router.delete('/:id', verifyToken, requireRole(['FARMER', 'ADMIN']), ctrl.deleteProduct);
router.get('/mine',   verifyToken, requireRole('FARMER'), ctrl.getMyProducts);
router.patch('/:id/availability', verifyToken, requireRole('FARMER'), ctrl.toggleAvailability);

module.exports = router;
