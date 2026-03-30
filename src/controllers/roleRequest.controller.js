const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');

// @desc    Soumettre une demande d'extension (FARMER ou TRANSPORTER)
// @route   POST /api/support/role-requests
// @access  Private
exports.createRoleRequest = async (req, res) => {
  try {
    const { requestedRole, details } = req.body;

    if (!requestedRole || !['FARMER', 'TRANSPORTER'].includes(requestedRole)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }

    // Vérifier si l'utilisateur a déjà ce rôle (via canSell/canDeliver)
    const userRole = req.user.role.toUpperCase();
    if (requestedRole === 'FARMER' && req.user.canSell) {
      return res.status(400).json({ success: false, message: 'Vous êtes déjà producteur.' });
    }
    if (requestedRole === 'TRANSPORTER' && (userRole === 'TRANSPORTER' || req.user.canDeliver)) {
      return res.status(400).json({ success: false, message: 'Vous êtes déjà livreur.' });
    }

    // Vérifier s'il a déjà une demande en attente
    const existingReq = await RoleRequest.findOne({ user: req.user.id, requestedRole, status: 'PENDING' });
    if (existingReq) {
      return res.status(400).json({ success: false, message: 'Une demande est déjà en attente.' });
    }

    const roleRequest = await RoleRequest.create({
      user: req.user.id,
      requestedRole,
      details: details || {}
    });

    res.status(201).json({ success: true, data: roleRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// @desc    Lister toutes les demandes (Admin)
// @route   GET /api/admin/role-requests
// @access  Private/Admin
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const requests = await RoleRequest.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// @desc    Approuver une demande (Admin)
// @route   PATCH /api/admin/role-requests/:id/approve
// @access  Private/Admin
exports.approveRequest = async (req, res) => {
  try {
    const roleReq = await RoleRequest.findById(req.params.id);
    if (!roleReq) return res.status(404).json({ success: false, message: 'Demande introuvable.' });
    if (roleReq.status !== 'PENDING') return res.status(400).json({ success: false, message: `Demande déjà ${roleReq.status}.` });

    roleReq.status = 'APPROVED';
    await roleReq.save();

    const user = await User.findById(roleReq.user);
    if (user) {
      if (roleReq.requestedRole === 'FARMER') user.canSell = true;
      if (roleReq.requestedRole === 'TRANSPORTER') user.canDeliver = true;
      await user.save();
    }

    res.status(200).json({ success: true, data: roleReq, message: 'Approuvée. Permissions accordées.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// @desc    Rejeter une demande (Admin)
// @route   PATCH /api/admin/role-requests/:id/reject
// @access  Private/Admin
exports.rejectRequest = async (req, res) => {
  try {
    const { adminComment } = req.body;
    const roleReq = await RoleRequest.findById(req.params.id);
    
    if (!roleReq) return res.status(404).json({ success: false, message: 'Demande introuvable.' });
    if (roleReq.status !== 'PENDING') return res.status(400).json({ success: false, message: `Demande déjà ${roleReq.status}.` });

    roleReq.status = 'REJECTED';
    roleReq.adminComment = adminComment || '';
    await roleReq.save();

    res.status(200).json({ success: true, data: roleReq, message: 'Demande rejetée.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};
