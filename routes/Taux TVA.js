const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


// =========================
// 🟢 MODELE TVA SAAS
// =========================
const Tva = mongoose.model("Tva", {
  valeur: Number,
  idEntreprise: String
});


// =========================
// 📄 GET TVA (SAAS)
// =========================
router.get("/", async (req, res) => {

  try {

    const { idEntreprise } = req.query;

    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    const data = await Tva.find({ idEntreprise });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }

});


// =========================
// ➕ ADD TVA
// =========================
router.post("/", async (req, res) => {

  try {

    const { valeur, idEntreprise } = req.body;

    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    const data = await Tva.create({
      valeur,
      idEntreprise
    });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Erreur création TVA" });
  }

});


// =========================
// ❌ DELETE TVA (SAAS)
// =========================
router.delete("/:id", async (req, res) => {

  try {

    const { idEntreprise } = req.query;

    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    const tva = await Tva.findOne({
      _id: req.params.id,
      idEntreprise
    });

    if (!tva) {
      return res.status(404).json({ message: "Non autorisé" });
    }

    await Tva.findByIdAndDelete(req.params.id);

    res.json({ message: "supprimé" });

  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }

});


// =========================
// 🔵 EXPORT
// =========================
module.exports = router;