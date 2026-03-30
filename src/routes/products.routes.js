const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireCapability } = require('../middleware/capabilities.middleware');
const upload = require('../middleware/upload.middleware');
const ctrl = require('../controllers/product.controller');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestion du catalogue de produits
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Liste des produits (Public avec filtres)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 */
router.get('/',      ctrl.getCatalog);

/**
 * @swagger
 * /api/products/mine:
 *   get:
 *     summary: Voir mes produits personnels
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/mine',   verifyToken, requireCapability('canSell'), ctrl.getMyProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Détails d'un produit spécifique
 *     tags: [Products]
 */
router.get('/:id',   ctrl.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Publier un nouveau produit (FARMER)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/',     verifyToken, requireCapability('canSell'), upload.array('images', 5), ctrl.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Modifier un produit
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/:id',    verifyToken, requireCapability('canSell'), upload.array('images', 5), ctrl.updateProduct);
router.patch('/:id',  verifyToken, requireCapability('canSell'), upload.array('images', 5), ctrl.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Supprimer un produit
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', verifyToken, requireCapability('canSell'), ctrl.deleteProduct);

/**
 * @swagger
 * /api/products/{id}/availability:
 *   patch:
 *     summary: Activer/Désactiver la disponibilité d'un produit
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/status',       verifyToken, requireCapability('canSell'), ctrl.updateStatus);
router.patch('/:id/availability', verifyToken, requireCapability('canSell'), ctrl.toggleAvailability);

module.exports = router;
