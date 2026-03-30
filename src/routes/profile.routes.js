const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const authCtrl = require('../controllers/auth.controller');
const upload = require('../middleware/upload.middleware');

router.use(verifyToken);

router.patch('/', authCtrl.updateProfile);
router.post('/picture', upload.single('avatar'), async (req, res) => {
  try {
    const User = require('../models/User');
    // Important: Cloudinary usage if path exists
    const profilePicture = req.file.path; 
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { profilePicture },
      { new: true }
    );
    res.json({ message: 'Photo mise à jour', profilePicture, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.patch('/password', authCtrl.changePassword);

module.exports = router;
