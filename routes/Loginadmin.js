const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// =======================
// ADMIN
// =======================
const ADMIN = {
  entrepriseId: "admin001",
  user: "admin",
  password: "$2b$10$WsEzYOHmjGWtonRle6Hc7.qZo4noK8.r72uMdbz80X1iEDSaTKXZS"
};

// =======================
// LOGIN ADMIN
// =======================
router.post("/", async (req, res) => {
  try {

    console.log("BODY RECU:", req.body);

    const { entrepriseId, user, password } = req.body || {};

    const entrepriseIdClean = entrepriseId?.trim();
    const userClean = user?.trim();
    const passwordClean = password?.trim();

    console.log("CHECK START");

    // CHECK IDENTIFIANTS
    if (
      entrepriseIdClean !== ADMIN.entrepriseId ||
      userClean !== ADMIN.user
    ) {
      console.log("FAIL CHECK");
      return res.status(401).json({ msg: "Identifiants incorrects" });
    }

    console.log("CHECK PASSED");

    // CHECK PASSWORD
    const passwordOK = await bcrypt.compare(
      passwordClean,
      ADMIN.password
    );

    console.log("PASSWORD OK =", passwordOK);

    if (!passwordOK) {
      return res.status(401).json({
        msg: "Identifiants incorrects"
      });
    }

    // SESSION
    req.session.admin = {
      entrepriseId: ADMIN.entrepriseId,
      user: ADMIN.user,
      role: "superadmin",
      loginAt: new Date()
    };

    req.session.save((err) => {
      if (err) {
        console.error("SESSION ERROR:", err);
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
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      msg: "Erreur serveur"
    });
  }
});

module.exports = router;