const express = require('express');
const router = express.Router();
const {
  createRoleRequest,
  getAllRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/roleRequest.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');

// Routes Utilisateur
router.post('/support/role-requests', verifyToken, createRoleRequest);

// Routes Admin
router.get('/admin/role-requests', verifyToken, requireRole('ADMIN'), getAllRequests);
router.patch('/admin/role-requests/:id/approve', verifyToken, requireRole('ADMIN'), approveRequest);
router.patch('/admin/role-requests/:id/reject', verifyToken, requireRole('ADMIN'), rejectRequest);

module.exports = router;
