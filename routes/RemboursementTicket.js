const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// =========================
// MODEL
// =========================
const RemboursementSchema = new mongoose.Schema({
  idEntreprise: String,
  venteId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  produits: Array,
  totalGeneral: Number
});

const Remboursement =
  mongoose.models.Remboursement ||
  mongoose.model("Remboursement", RemboursementSchema);

const Vente = mongoose.models.Vente;

// =========================
// REMBOURSER
// =========================
router.post("/:id", async (req, res) => {
  try {

    const vente = await Vente.findById(req.params.id);

    if (!vente) {
      return res.status(404).json({ message: "Vente introuvable" });
    }

    await Remboursement.create({
      idEntreprise: vente.idEntreprise,
      venteId: vente._id,
      produits: vente.produits,
      totalGeneral: vente.totalGeneral
    });

    await Vente.findByIdAndDelete(req.params.id);

    res.json({ message: "Remboursement effectué" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// LISTE REMBOURSEMENTS
// =========================
router.get("/", async (req, res) => {
  const data = await Remboursement.find().sort({ date: -1 });
  res.json(data);
});

module.exports = router;