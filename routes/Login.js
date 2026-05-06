const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // 🔐 ajouté

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
      return res.status(400).json({ msg: "Champs manquants" });
    }

    const entreprise = await Entreprise.findById(entrepriseId);

    if (!entreprise) {
      return res.status(404).json({ msg: "Entreprise introuvable" });
    }

    // 🔎 chercher utilisateur
    const foundUser = entreprise.users.find(u => u.user === user);

    if (!foundUser) {
      return res.status(401).json({ msg: "Login incorrect" });
    }

    // 🔐 comparaison bcrypt
    const isMatch = await bcrypt.compare(password, foundUser.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Login incorrect" });
    }

    // ✅ succès login
    res.json({
      msg: "Connexion réussie",
      entrepriseId: entreprise._id,
      user: {
        name: foundUser.user,
        role: foundUser.role
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;