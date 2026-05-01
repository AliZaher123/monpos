const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// =========================
// 🧾 MODELE VENTE (SAFE)
// =========================
const VenteSchema = new mongoose.Schema({
  idEntreprise: { type: String, required: true },
  date: { type: Date, default: Date.now },

  produits: [
    {
      idProduit: String,
      nom: String,
      prix: Number,
      quantite: Number,
      total: Number
    }
  ],

  totalGeneral: { type: Number, default: 0 },
  paiement: String
});

const Vente =
  mongoose.models.Vente || mongoose.model("Vente", VenteSchema);

// =========================
// 📊 RAPPORT VENTES
// =========================
router.get("/rapport-ventes", async (req, res) => {
  try {

    const { idEntreprise, dateDebut, dateFin } = req.query;

    if (!idEntreprise || !dateDebut || !dateFin) {
      return res.status(400).json({
        message: "Paramètres manquants"
      });
    }

    // =========================
    // 📅 FIX DATE SAFE
    // =========================
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);

    // =========================
    // 🔎 QUERY
    // =========================
    const ventes = await Vente.find({
      idEntreprise,
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: -1 });

    // =========================
    // 📊 CALCULS
    // =========================
    let total = 0;

    for (let v of ventes) {
      total += v.totalGeneral || 0;
    }

    // =========================
    // 📤 RESPONSE
    // =========================
    res.json({
      ventes,
      total,
      count: ventes.length
    });

  } catch (err) {
    console.error("❌ Rapport error:", err);
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;