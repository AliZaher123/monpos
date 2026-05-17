const express = require("express");
const router = express.Router();

// ======================
// LOGOUT ADMIN
// ======================
router.post("/logout-admin", (req, res) => {

  if (!req.session) {
    return res.status(400).json({ msg: "Aucune session trouvée" });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: "Erreur lors du logout" });
    }

    // supprimer cookie session
    res.clearCookie("connect.sid");

    return res.json({ msg: "Déconnexion réussie" });
  });
});

module.exports = router;