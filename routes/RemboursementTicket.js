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
// REMBOURSER UNE VENTE
// =========================
router.post("/:id", async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id);

    if (!vente) {
      return res.status(404).json({
        message: "Vente introuvable"
      });
    }

    // Enregistrer dans la collection Remboursement
    await Remboursement.create({
      idEntreprise: vente.idEntreprise,
      venteId: vente._id,
      produits: vente.produits,
      totalGeneral: vente.totalGeneral
    });

    // Supprimer de la collection Vente
    await Vente.findByIdAndDelete(req.params.id);

    res.json({
      message: "Remboursement effectué"
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// LISTE REMBOURSEMENTS
// + FILTRE PAR ENTREPRISE
// + FILTRE PAR DATE
// =========================
router.get("/", async (req, res) => {
  try {
    const { idEntreprise, dateDebut, dateFin } = req.query;

    if (!idEntreprise) {
      return res.status(400).json({
        message: "idEntreprise requis"
      });
    }

    // Filtre de base
    const filtre = {
      idEntreprise
    };

    // Filtre par dates (optionnel)
    if (dateDebut || dateFin) {
      filtre.date = {};

      if (dateDebut) {
        // Début de journée
        filtre.date.$gte = new Date(dateDebut + "T00:00:00");
      }

      if (dateFin) {
        // Fin de journée
        filtre.date.$lte = new Date(dateFin + "T23:59:59.999");
      }
    }

    const data = await Remboursement.find(filtre)
      .sort({ date: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;