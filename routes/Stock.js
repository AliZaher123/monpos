const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


// =========================
// 🟢 MODELE STOCK SAAS
// =========================
const Stock = mongoose.model("Stock", {
  nom: String,
  codebarre: String,

  // ⚠️ PRIX = TTC
  prix: Number,

  // STOCK
  quantite: Number,
  quantiteInitiale: Number,

  categorie: String,
  tva: Number,

  type: { type: String, default: "Produit" },

  // CALCULS
  prixHT: Number,
  montantTVA: Number,
  prixTTC: Number,
  totalTTC: Number,

  idEntreprise: String
});


// =========================
// ➕ AJOUT PRODUIT / SERVICE
// =========================
router.post("/", async (req, res) => {

  const {
    nom,
    codebarre,
    prix,
    quantite,
    categorie,
    tva,
    type,
    idEntreprise
  } = req.body;

  if (!idEntreprise) {
    return res.status(400).json({ message: "idEntreprise requis" });
  }

  let prixTTC = Number(prix); // ✅ prix saisi = TTC
  let tvaNum = Number(tva || 0);
  let qtyNum = Number(quantite || 0);

  if (type === "Service") {
    qtyNum = 0;
  }

  // ✅ EXTRACTION TVA
  let prixHT = prixTTC / (1 + tvaNum / 100);
  let montantTVA = prixTTC - prixHT;

  let totalTTC = prixTTC * (qtyNum || 1);

  const data = await Stock.create({
    nom,
    codebarre,

    prix: prixTTC,

    quantite: qtyNum,
    quantiteInitiale: qtyNum,

    categorie,
    tva: tvaNum,
    type: type || "Produit",

    prixHT,
    montantTVA,
    prixTTC,
    totalTTC,

    idEntreprise
  });

  res.json(data);
});


// =========================
// 📄 GET STOCK SAAS
// =========================
router.get("/", async (req, res) => {

  const { idEntreprise } = req.query;

  if (!idEntreprise) {
    return res.status(400).json({ message: "idEntreprise requis" });
  }

  const data = await Stock.find({ idEntreprise });

  res.json(data);
});


// =========================
// ❌ DELETE
// =========================
router.delete("/:id", async (req, res) => {

  const { idEntreprise } = req.query;

  if (!idEntreprise) {
    return res.status(400).json({ message: "idEntreprise requis" });
  }

  const stock = await Stock.findOne({
    _id: req.params.id,
    idEntreprise
  });

  if (!stock) {
    return res.status(404).json({ message: "Non autorisé" });
  }

  await Stock.findByIdAndDelete(req.params.id);

  res.json({ message: "supprimé" });
});


// =========================
// ✏️ UPDATE STOCK
// =========================
router.put("/:id", async (req, res) => {

  const { idEntreprise } = req.query;

  if (!idEntreprise) {
    return res.status(400).json({ message: "idEntreprise requis" });
  }

  const stock = await Stock.findOne({
    _id: req.params.id,
    idEntreprise
  });

  if (!stock) {
    return res.status(404).json({ message: "Non autorisé" });
  }

  // SERVICE BLOQUÉ
  if (stock.type === "Service") {
    return res.json({
      message: "Service - stock non modifiable",
      data: stock
    });
  }

  let prixTTC = Number(req.body.prix ?? stock.prix);
  let tva = Number(req.body.tva ?? stock.tva);
  let quantite = Number(req.body.quantite ?? stock.quantite);
  let quantiteInitiale = Number(req.body.quantiteInitiale ?? stock.quantiteInitiale);

  // ✅ EXTRACTION TVA
  let prixHT = prixTTC / (1 + tva / 100);
  let montantTVA = prixTTC - prixHT;

  let totalTTC = prixTTC * quantite;

  const updated = await Stock.findByIdAndUpdate(
    req.params.id,
    {
      prix: prixTTC,
      tva,
      quantite,
      quantiteInitiale,
      prixHT,
      montantTVA,
      prixTTC,
      totalTTC
    },
    { new: true }
  );

  res.json(updated);
});


// =========================
// 🔥 DIMINUTION STOCK (VENTE)
// =========================
router.post("/decrement", async (req, res) => {

  const { idProduit, quantite, idEntreprise } = req.body;

  const produit = await Stock.findOne({
    _id: idProduit,
    idEntreprise
  });

  if (!produit) {
    return res.status(404).json({ message: "Produit introuvable" });
  }

  // SERVICE IGNORÉ
  if (produit.type === "Service") {
    return res.json({ message: "Service ignoré", produit });
  }

  produit.quantite -= Number(quantite);

  if (produit.quantite < 0) produit.quantite = 0;

  // 🔁 recalcul total
  produit.totalTTC = produit.prixTTC * produit.quantite;

  await produit.save();

  res.json({ message: "Stock mis à jour", produit });
});


// =========================
// 🔵 EXPORT
// =========================
module.exports = router;