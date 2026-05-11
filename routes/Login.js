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

    // ======================
    // ❌ champs manquants
    // ======================
    if (!entrepriseId || !user || !password) {
      return res.status(400).json({
        msg: "Champs manquants"
      });
    }

    // ======================
    // 🔎 entreprise
    // ======================
    const entreprise = await Entreprise.findById(entrepriseId);

    if (!entreprise) {
      return res.status(404).json({
        msg: "Entreprise introuvable"
      });
    }

    // ======================
    // 🔎 user
    // ======================
    const foundUser = entreprise.users.find(
      u => u.user === user
    );

    if (!foundUser) {
      return res.status(401).json({
        msg: "Login incorrect"
      });
    }

    // ======================
    // 🔐 password check
    // ======================
    const isMatch = await bcrypt.compare(
      password,
      foundUser.password
    );

    if (!isMatch) {
      return res.status(401).json({
        msg: "Login incorrect"
      });
    }

    // ======================
    // 🔥 SESSION PROPRE (RENDER SAFE)
    // ======================
    req.session.regenerate((err) => {

      if (err) {
        console.log("SESSION REGENERATE ERROR:", err);
        return res.status(500).json({
          msg: "Session error"
        });
      }

      req.session.user = {
        entrepriseId: entreprise._id,
        name: foundUser.user,
        role: foundUser.role
      };

      // ======================
      // 💾 SAVE SESSION
      // ======================
      req.session.save((err) => {

        if (err) {
          console.log("SESSION SAVE ERROR:", err);
          return res.status(500).json({
            msg: "Erreur session"
          });
        }

        // ======================
        // 🔥 DEBUG LOGS
        // ======================
        console.log("LOGIN sessionID:", req.sessionID);
        console.log("LOGIN user:", req.session.user);

        // ======================
        // ✅ RESPONSE FRONTEND
        // ======================
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















module.exports = router;