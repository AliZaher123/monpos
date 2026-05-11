const express = require("express");
const router = express.Router();

// ======================
// 🔐 LOGOUT ROUTE
// ======================
router.post("/", (req, res) => {

  try {

    // ======================
    // 🔎 CHECK SESSION EXISTE
    // ======================
    if (!req.session) {
      return res.status(400).json({
        msg: "Pas de session"
      });
    }

    // ======================
    // 🔥 DESTROY SESSION (comme ton regenerate côté login)
    // ======================
    req.session.destroy((err) => {

      if (err) {
        console.log("SESSION DESTROY ERROR:", err);
        return res.status(500).json({
          msg: "Erreur logout"
        });
      }

      // ======================
      // 🍪 SUPPRIME COOKIE (IMPORTANT AVEC SESSION STORE)
      // ======================
      res.clearCookie("connect.sid", {
        path: "/"
      });

      // ======================
      // 🔥 DEBUG LOGS (comme login)
      // ======================
      console.log("LOGOUT sessionID:", req.sessionID);
      console.log("SESSION DESTROYED");

      // ======================
      // ✅ RESPONSE FRONTEND
      // ======================
      return res.json({
        msg: "Déconnecté avec succès"
      });

    });

  } catch (err) {

    console.log("LOGOUT ERROR:", err);

    return res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;