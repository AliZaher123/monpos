const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

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
// 📄 GET ALL ENTREPRISES (FRONTEND READY)
// ======================
router.get("/", async (req, res) => {
  try {

    const data = await Entreprise.find();
    const now = new Date();

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
        status: expireAt < now ? "expired" : "active"
      };
    });

    res.json(result);

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

    entreprise.users.push({
      user: req.body.user,
      password: req.body.password,
      role: req.body.role || "user"
    });

    await entreprise.save();

    res.json({ success: true, entreprise });

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

    res.json({ success: true, entreprise });

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

    res.json({ success: true, msg: "Entreprise supprimée" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;