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

    console.log("BODY RECU:", req.body);

    if (!req.body) {
      return res.status(400).json({
        msg: "Body vide"
      });
    }

    const { entrepriseId, user, password } = req.body;

    const entrepriseIdClean = entrepriseId?.trim();
    const userClean = user?.trim();
    const passwordClean = password?.trim();

   console.log("CHECK START");

if (
  entrepriseId.trim() !== ADMIN.entrepriseId ||
  user.trim() !== ADMIN.user
) {
  console.log("FAIL CHECK");
  return res.status(401).json({ msg: "Identifiants incorrects" });
}

console.log("CHECK PASSED");

    const passwordOK = await bcrypt.compare(
      passwordClean,
      ADMIN.password
    );

    if (!passwordOK) {
      return res.status(401).json({
        msg: "Identifiants incorrects"
      });
    }

    req.session.admin = {
      entrepriseId: ADMIN.entrepriseId,
      user: ADMIN.user,
      role: "superadmin",
      loginAt: new Date()
    };

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          msg: "Erreur session"
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
    console.error(error);
    return res.status(500).json({
      msg: "Erreur serveur"
    });
  }
});

module.exports = router;