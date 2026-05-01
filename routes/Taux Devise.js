const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


// =========================
// 🟢 MODELE TAUX DE DEVISE
// =========================
const Taux = mongoose.model("Taux", {
  usd_cdf: Number,
  idEntreprise: String
});


// =========================
// 📄 GET TAUX (SAAS)
// =========================
router.get("/", async (req, res) => {

  try {

    const { idEntreprise } = req.query;

    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    const data = await Taux.findOne({ idEntreprise });

    res.json(data || { usd_cdf: 2800 });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }

});


// =========================
// ➕ SAVE / UPDATE TAUX
// =========================
router.post("/", async (req, res) => {

  try {

    const { usd_cdf, idEntreprise } = req.body;

    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    const data = await Taux.findOneAndUpdate(
      { idEntreprise },
      { usd_cdf, idEntreprise },
      { new: true, upsert: true }
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Erreur sauvegarde taux" });
  }

});


// =========================
// 🔵 EXPORT
// =========================
module.exports = router;