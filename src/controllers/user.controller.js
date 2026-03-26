const User = require('../models/User');

exports.rateUser = async (req, res) => {
  try {
    const { score, comment } = req.body;
    const targetUserId = req.params.id;
    const reviewerId = req.user.sub;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Le score doit être compris entre 1 et 5' });
    }

    if (targetUserId === reviewerId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous noter vous-même' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà noté cette personne (optionnel, on peut autoriser l'édition)
    const existingRatingIndex = targetUser.ratings.findIndex(r => r.from.toString() === reviewerId);

    if (existingRatingIndex >= 0) {
      // Mettre à jour la note existante
      targetUser.ratings[existingRatingIndex].score = score;
      targetUser.ratings[existingRatingIndex].comment = comment || targetUser.ratings[existingRatingIndex].comment;
      targetUser.ratings[existingRatingIndex].createdAt = Date.now();
    } else {
      // Ajouter une nouvelle note
      targetUser.ratings.push({
        from: reviewerId,
        score,
        comment
      });
      targetUser.totalRatings += 1;
    }

    // Recalculer la moyenne
    const totalScore = targetUser.ratings.reduce((acc, curr) => acc + curr.score, 0);
    targetUser.averageRating = totalScore / targetUser.totalRatings;

    await targetUser.save();

    res.json({ 
      message: 'Note enregistrée avec succès', 
      averageRating: targetUser.averageRating, 
      totalRatings: targetUser.totalRatings 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
