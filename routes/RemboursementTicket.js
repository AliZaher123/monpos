const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// =========================
// 💸 MODELE REMBOURSEMENT
// =========================
const RemboursementSchema = new mongoose.Schema({
  idEntreprise: String,

  venteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  date: { type: Date, default: Date.now },

  produits: [
    {
      nom: String,
      prix: Number,
      quantite: Number,
      total: Number
    }
  ],

  totalGeneral: Number
});

const Remboursement =
  mongoose.models.Remboursement ||
  mongoose.model("Remboursement", RemboursementSchema);

const Vente = mongoose.models.Vente;

// =========================
// 💸 REMBOURSER UNE VENTE
// =========================
router.post("/:id", async (req, res) => {
  try {

    const venteId = req.params.id;

    const vente = await Vente.findById(venteId);

    if (!vente) {
      return res.status(404).json({ message: "Vente introuvable" });
    }

    // =========================
    // 💾 SAVE REMBOURSEMENT
    // =========================
    const remboursement = await Remboursement.create({
      idEntreprise: vente.idEntreprise,
      venteId: vente._id,
      produits: vente.produits,
      totalGeneral: vente.totalGeneral
    });

    // =========================
    // 🗑️ SUPPRIMER VENTE
    // =========================
    await Vente.findByIdAndDelete(venteId);

    console.log("💸 REMBOURSEMENT OK:", remboursement._id);

    res.json({
      message: "Remboursement effectué",
      id: remboursement._id
    });

  } catch (error) {
    console.log("❌ ERREUR REMBOURSEMENT:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 📦 GET REMBOURSEMENTS
// =========================
router.get("/", async (req, res) => {
  try {
    const data = await Remboursement.find().sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;