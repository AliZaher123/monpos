const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// =========================
// 🧾 MODELE VENTE
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

  totalGeneral: Number,
  paiement: String
});

// éviter recompile error
const Vente =
  mongoose.models.Vente || mongoose.model("Vente", VenteSchema);

// =========================
// 🛒 CREER UNE VENTE
// =========================
router.post("/", async (req, res) => {
  try {

    console.log("📥 BODY REÇU:", req.body);

    // ✅ compatible frontend
    const {
      produits,
      panier,
      paiement,
      idEntreprise,
      totalGeneral
    } = req.body;

    if (!idEntreprise) {
      return res.status(400).json({ message: "Entreprise manquante" });
    }

    // 🔥 support 2 formats (sécurité)
    const liste = produits || panier;

    if (!liste || !Array.isArray(liste) || liste.length === 0) {
      return res.status(400).json({ message: "Panier vide ou invalide" });
    }

    let total = 0;

    const produitsClean = liste.map(item => {

      const prix = Number(item.prix || 0);
      const qty = Number(item.quantite || item.qty || 0);

      const lineTotal = prix * qty;
      total += lineTotal;

      return {
        idProduit: item.idProduit || item.id || null,
        nom: item.nom || "Produit",
        prix,
        quantite: qty,
        total: lineTotal
      };
    });

    // =========================
    // 💾 SAVE VENTE
    // =========================
    const vente = await Vente.create({
      idEntreprise,
      produits: produitsClean,
      totalGeneral: totalGeneral || total,
      paiement: paiement || "cash"
    });

    console.log("✅ VENTE OK:", vente._id);

    // =========================
    // 📉 STOCK UPDATE SAFE
    // =========================
    try {
      const Stock = mongoose.model("Stock");

      for (let item of produitsClean) {

        if (!item.idProduit) continue;
        if (!mongoose.Types.ObjectId.isValid(item.idProduit)) continue;

        await Stock.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(item.idProduit),
            idEntreprise
          },
          { $inc: { quantite: -item.quantite } },
          { new: true }
        );
      }

    } catch (stockError) {
      console.log("⚠️ STOCK ERROR (non bloquant):", stockError.message);
    }

    // =========================
    // RESPONSE
    // =========================
    res.json({
      message: "Vente enregistrée avec succès",
      id: vente._id,
      total: totalGeneral || total
    });

  } catch (error) {
    console.log("❌ ERREUR VENTE:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;