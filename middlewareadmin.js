// middleware/verifyAdmin.js

function verifyAdmin(req, res, next) {
  try {
    // Vérifie si la session admin existe
    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        msg: "Accès refusé. Veuillez vous connecter."
      });
    }

    // Vérifie que le rôle est bien superadmin
    if (req.session.admin.role !== "superadmin") {
      return res.status(403).json({
        msg: "Accès interdit."
      });
    }

    // La session est valide, on passe à la route suivante
    next();

  } catch (error) {
    console.error("Erreur verifyAdmin :", error);

    return res.status(500).json({
      msg: "Erreur serveur"
    });
  }
}

module.exports = verifyAdmin;