const express = require("express");
const mongoose = require("mongoose");

// ✅ IMPORTANT : créer router AVANT utilisation
const router = express.Router();


// ======================
// 🧠 MODEL ENTREPRISE
// ======================
const userSchema = new mongoose.Schema({
  user: String,
  password: String,
  role: String
});

const entrepriseSchema = new mongoose.Schema({
  _id: String,
  name: String,
  users: [userSchema]
});

const Entreprise = mongoose.model("Entreprise", entrepriseSchema);


// ======================
// 🔐 LOGIN ROUTE
// ======================
router.post("/", async (req, res) => {
  try {
    const { entrepriseId, user, password } = req.body;

    const entreprise = await Entreprise.findById(entrepriseId);

    if (!entreprise) {
      return res.status(404).json({ msg: "Entreprise introuvable" });
    }

    const foundUser = entreprise.users.find(u =>
      u.user === user && u.password === password
    );

    if (!foundUser) {
      return res.status(401).json({ msg: "Login incorrect" });
    }

    res.json({
      msg: "Connexion réussie",
      entrepriseId,
      user: foundUser.user,
      role: foundUser.role
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;