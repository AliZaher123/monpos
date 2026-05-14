const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const router = express.Router();

// ======================
// 🧠 USER SCHEMA
// ======================
const userSchema = new mongoose.Schema({
  user: String,
  password: String,
  role: String
}, { _id: false });

// ======================
// 🏢 ENTREPRISE SCHEMA
// ======================
const entrepriseSchema = new mongoose.Schema({
  _id: String,
  name: String,
  users: { type: [userSchema], default: [] }
});

const Entreprise =
  mongoose.models.Entreprise ||
  mongoose.model("Entreprise", entrepriseSchema);

// ======================
// 🔐 LOGIN ROUTE
// ======================
router.post("/", async (req, res) => {

  try {

    const { entrepriseId, user, password } = req.body;

    if (!entrepriseId || !user || !password) {
      return res.status(400).json({
        msg: "Champs manquants"
      });
    }

    const entreprise = await Entreprise.findById(entrepriseId);

    if (!entreprise) {
      return res.status(404).json({
        msg: "Entreprise introuvable"
      });
    }

    // ✅ CHECK EXPIRATION ICI (BON ENDROIT)
    if (isExpired(entreprise)) {
      return res.status(403).json({
        success: false,
        expired: true,
        msg: "Votre abonnement a expiré"
      });
    }

    const foundUser = entreprise.users.find(
      u => u.user === user
    );

    if (!foundUser) {
      return res.status(401).json({
        msg: "Login incorrect"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      foundUser.password
    );

    if (!isMatch) {
      return res.status(401).json({
        msg: "Login incorrect"
      });
    }

    req.session.regenerate((err) => {

      if (err) {
        return res.status(500).json({
          msg: "Session error"
        });
      }

      req.session.user = {
        entrepriseId: entreprise._id,
        name: foundUser.user,
        role: foundUser.role
      };

      req.session.save((err) => {

        if (err) {
          return res.status(500).json({
            msg: "Erreur session"
          });
        }

        return res.json({
          msg: "Connexion réussie",
          user: req.session.user
        });

      });

    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }

});

// ======================
// ⛔ EXPIRATION FUNCTION (EN HAUT)
// ======================
function isExpired(entreprise) {
  if (!entreprise.createdAt) return false;

  const createdAt = new Date(entreprise.createdAt);
  const expireAt = new Date(createdAt);

  expireAt.setDate(
    expireAt.getDate() + (entreprise.duration || 7)
  );

  return new Date() > expireAt;
}

module.exports = router;