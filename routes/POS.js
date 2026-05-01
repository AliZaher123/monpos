// ================================
// 📦 MODULE VENTE (POS.js)
// ================================

const express = require("express");          // Framework API
const router = express.Router();             // Routeur Express
const mongoose = require("mongoose");        // MongoDB ORM


// ================================
// 💳 MODÈLE VENTE (TABLE MongoDB)
// ================================
const Sale = mongoose.model("Sale", {
  items: Array,                              // Produits achetés (panier)
  totalUSD: Number,                         // Total en USD
  totalCDF: Number,                         // Total en CDF
  paymentMethod: String,                    // Cash / Mobile Money etc
  remark: String,                           // Note client
  date: { type: Date, default: Date.now }   // Date automatique
});


// ================================
// ➕ AJOUTER UNE VENTE
// ================================
router.post("/vente", async (req, res) => {
  try {
    const sale = new Sale(req.body);        // Création vente avec données reçues
    await sale.save();                      // Sauvegarde dans MongoDB
    res.json({ success: true, sale });      // Réponse succès
  } catch (err) {
    res.status(500).json({ error: err.message }); // Erreur serveur
  }
});


// ================================
// 📄 LISTER TOUTES LES VENTES
// ================================
router.get("/vente", async (req, res) => {
  try {
    const data = await Sale.find()          // Récupère toutes les ventes
      .sort({ date: -1 });                 // Du plus récent au plus ancien

    res.json(data);                        // Envoie les données au client
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================================
// 🔍 OBTENIR UNE VENTE PAR ID
// ================================
router.get("/vente/:id", async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id); // Recherche par ID
    res.json(sale);                                  // Retourne la vente
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================================
// 🗑️ SUPPRIMER UNE VENTE
// ================================
router.delete("/vente/:id", async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id); // Supprime vente
    res.json({ success: true });                 // Confirmation
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================================
// 📤 EXPORT MODULE ROUTES
// ================================
module.exports = router;