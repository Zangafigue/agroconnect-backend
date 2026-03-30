const express = require('express');
const router = express.Router();
const {
  createRoleRequest,
  getAllRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/roleRequest.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Routes Utilisateur
router.post('/support/role-requests', protect, createRoleRequest);

// Routes Admin
router.get('/admin/role-requests', protect, admin, getAllRequests);
router.patch('/admin/role-requests/:id/approve', protect, admin, approveRequest);
router.patch('/admin/role-requests/:id/reject', protect, admin, rejectRequest);

module.exports = router;
