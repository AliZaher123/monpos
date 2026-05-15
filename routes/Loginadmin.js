const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// =======================
// ADMIN (source backend)
// Mot de passe réel : 1234
// Généré avec : bcrypt.hashSync("1234", 10)
// =======================
const ADMIN = {
  entrepriseId: "admin001",
  user: "admin",
  password:
    "$2b$10$g8l3eN3m3H9v0L7oK1wM7eYqWQ0sM8mA5Qm7o8gL0rWqjX5mQxV3K"
};

// =======================
// LOGIN ADMIN
// =======================
router.post("/", async (req, res) => {
  try {
    const { entrepriseId, user, password } = req.body;

    // Vérification entrepriseId et user
    if (
      entrepriseId !== ADMIN.entrepriseId ||
      user !== ADMIN.user
    ) {
      return res.status(401).json({
        msg: "Identifiants incorrects"
      });
    }

    // Vérification mot de passe hashé
    const passwordOK = await bcrypt.compare(
      password,
      ADMIN.password
    );

    if (!passwordOK) {
      return res.status(401).json({
        msg: "Identifiants incorrects"
      });
    }

    // =======================
    // CREATION DE LA SESSION
    // =======================
    req.session.admin = {
      entrepriseId: ADMIN.entrepriseId,
      user: ADMIN.user,
      role: "superadmin",
      loginAt: new Date()
    };

    // Sauvegarde explicite de la session
    req.session.save((err) => {
      if (err) {
        console.error("Erreur session admin :", err);
        return res.status(500).json({
          msg: "Erreur lors de la création de la session"
        });
      }

      return res.json({
        msg: "OK",
        user: ADMIN.user,
        entrepriseId: ADMIN.entrepriseId,
        role: "superadmin"
      });
    });
  } catch (error) {
    console.error("Erreur login admin :", error);
    return res.status(500).json({
      msg: "Erreur serveur"
    });
  }
});

module.exports = router;