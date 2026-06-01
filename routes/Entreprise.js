const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const router = express.Router();


// ======================
// 🔥 EXPIRATION LOGIC
// ======================
function isExpired(entreprise) {
  const createdAt = new Date(entreprise.createdAt);

  const expireAt = new Date(createdAt);
  expireAt.setDate(expireAt.getDate() + (entreprise.duration || 7));

  return new Date() > expireAt;
}


// ======================
// 👤 USER SCHEMA
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

  plan: { type: String, default: "free" },
  duration: { type: Number, default: 7 },
  note: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },

  users: { type: [userSchema], default: [] }
});

const Entreprise =
  mongoose.models.entreprises ||
  mongoose.model("entreprises", entrepriseSchema);


// ======================
// ➕ CREATE ENTREPRISE
// ======================
router.post("/", async (req, res) => {
  try {

    const entreprise = await Entreprise.create({
      _id: req.body._id,
      name: req.body.name,
      plan: req.body.plan || "free",
      duration: Number(req.body.duration || 7),
      note: req.body.note || "",
      createdAt: new Date(),
      users: []
    });

    res.json(entreprise);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// 📄 GET ALL ENTREPRISES
// ======================
router.get("/", async (req, res) => {
  try {

    const data = await Entreprise.find();

    const result = data.map(c => {

      const createdAt = c.createdAt || new Date();

      const expireAt = new Date(createdAt);
      expireAt.setDate(expireAt.getDate() + (c.duration || 7));

      return {
        _id: c._id,
        name: c.name,
        plan: c.plan,
        duration: c.duration,
        note: c.note,
        users: c.users || [],
        createdAt,
        expireAt: expireAt.toISOString(),

        // 🔥 IMPORTANT
        expired: isExpired(c)
      };
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// 🔐 LOGIN USER (BLOQUÉ SI EXPIRÉ)
// ======================
router.post("/:id/login", async (req, res) => {
  try {

    const { user, password } = req.body;

    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise)
      return res.status(404).json({ msg: "Entreprise introuvable" });

    // 🔥 BLOCK EXPIRATION
    if (isExpired(entreprise)) {
      return res.status(403).json({ msg: "⛔ Abonnement entreprise expiré. Veuillez renouveler." });
    }

    const foundUser = entreprise.users.find(u => u.user === user);
    if (!foundUser)
      return res.status(401).json({ msg: "Utilisateur introuvable" });

    const isMatch = await bcrypt.compare(password, foundUser.password);

    if (!isMatch)
      return res.status(401).json({ msg: "Mot de passe incorrect" });

    res.json({
      success: true,
      user: {
        name: foundUser.user,
        role: foundUser.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// 👤 ADD USER
// ======================
router.post("/:id/user", async (req, res) => {
  try {

    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise)
      return res.status(404).json({ msg: "Entreprise introuvable" });

    if (isExpired(entreprise)) {
      return res.status(403).json({ msg: "Entreprise expirée" });
    }

    const exist = entreprise.users.find(u => u.user === req.body.user);
    if (exist)
      return res.status(400).json({ msg: "Utilisateur existe déjà" });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    entreprise.users.push({
      user: req.body.user,
      password: hashedPassword,
      role: req.body.role || "user"
    });

    await entreprise.save();

    res.json({ success: true, entreprise });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// ✏️ UPDATE ENTREPRISE
// ======================
router.put("/:id", async (req, res) => {
  try {

    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise)
      return res.status(404).json({ msg: "Entreprise introuvable" });

    if (req.body.name) entreprise.name = req.body.name;
    if (req.body.plan) entreprise.plan = req.body.plan;
    if (req.body.duration) entreprise.duration = req.body.duration;
    if (req.body.note !== undefined) entreprise.note = req.body.note;

    await entreprise.save();

    res.json({ success: true, entreprise });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// ✏️ UPDATE USER
// ======================
router.put("/:id/user/:username", async (req, res) => {
  try {

    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise)
      return res.status(404).json({ msg: "Entreprise introuvable" });

    const existingUser = entreprise.users.find(
      u => u.user === req.params.username
    );

    if (!existingUser)
      return res.status(404).json({ msg: "User introuvable" });

    if (req.body.user) existingUser.user = req.body.user;
    if (req.body.role) existingUser.role = req.body.role;

    if (req.body.password) {
      existingUser.password = await bcrypt.hash(req.body.password, 10);
    }

    await entreprise.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// 🗑️ DELETE USER
// ======================
router.delete("/:id/user/:username", async (req, res) => {
  try {

    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise)
      return res.status(404).json({ msg: "Entreprise introuvable" });

    entreprise.users = entreprise.users.filter(
      u => u.user !== req.params.username
    );

    await entreprise.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ======================
// 🗑️ DELETE ENTREPRISE
// ======================
router.delete("/:id", async (req, res) => {
  try {

    await Entreprise.findByIdAndDelete(req.params.id);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;