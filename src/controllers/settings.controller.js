const User = require('../models/User');

exports.updatePreferences = async (req, res) => {
  try {
    // Store preferences in the user document
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: { preferences: req.body } },
      { new: true }
    );
    res.json({ message: 'Préférences mises à jour', preferences: user.preferences });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSettings = async (req, res) => {
  try {
    // Return some mock global settings
    res.json({
      siteName: 'AgroConnect BF',
      maintenanceMode: false,
      allowNewRegistrations: true
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateSettings = async (req, res) => {
  try {
    res.json({ message: 'Paramètres enregistrés' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.runInfraAction = async (req, res) => {
  try {
    const { action } = req.params;
    res.json({ message: `Action infrastructure exécutée : ${action}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
