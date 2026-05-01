const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ======================
// MODEL
// ======================
const settingsSchema = new mongoose.Schema({
  idEntreprise: { type: String, required: true, unique: true },
  headerText: String,
  footerText: String,
  logo: { type: String, default: null },
  enableTVA: Boolean
});

const Settings = mongoose.model("Settings", settingsSchema);

// ======================
// SAVE
// ======================
router.post("/save", async (req, res) => {

  const { idEntreprise, headerText, footerText, logo, enableTVA } = req.body;

  if (!idEntreprise) {
    return res.status(400).json({ error: "idEntreprise requis" });
  }

  console.log("LOGO SIZE:", logo ? logo.length : 0);

  try {

    const data = await Settings.findOneAndUpdate(
      { idEntreprise },
      {
        headerText,
        footerText,
        logo,
        enableTVA
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================
// GET
// ======================
router.get("/:idEntreprise", async (req, res) => {

  try {

    const data = await Settings.findOne({
      idEntreprise: req.params.idEntreprise
    });

    console.log("GET LOGO:", data?.logo ? "YES" : "NO");

    res.json(data || {});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;