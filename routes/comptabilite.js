const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const operationSchema = new mongoose.Schema({
  idEntreprise: { type: String, required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  libelle: { type: String, required: true, trim: true, maxlength: 200 },
  categorie: { type: String, required: true, enum: ["Revenu", "Dépense"] },
  montant: { type: Number, required: true, min: 0.01 }
}, { timestamps: true, collection: "comptabilites" });

// Atlas screenshot shows the target database as "test" and collection as
// "comptabilites". MONGO_DB can override the database per deployment.
const comptabiliteDb = mongoose.connection.useDb(process.env.MONGO_DB || "test");
const Comptabilite = comptabiliteDb.models.Comptabilite ||
  comptabiliteDb.model("Comptabilite", operationSchema);

function entrepriseId(req) {
  return req.session && req.session.user && req.session.user.entrepriseId
    ? String(req.session.user.entrepriseId)
    : null;
}

function validerOperation(body) {
  const date = typeof body.date === "string" ? body.date : "";
  const libelle = typeof body.libelle === "string" ? body.libelle.trim() : "";
  const categorie = body.categorie;
  const montant = Number(body.montant);
  const dateValide = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`));

  if (!dateValide || !libelle || libelle.length > 200 ||
      !["Revenu", "Dépense"].includes(categorie) ||
      !Number.isFinite(montant) || montant <= 0) {
    return { erreur: "Date, libellé, catégorie ou montant invalide." };
  }
  return { donnees: { date, libelle, categorie, montant } };
}

function gererErreur(res, erreur) {
  if (erreur instanceof mongoose.Error.ValidationError || erreur instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Données invalides." });
  }
  console.error("Erreur comptabilité:", erreur);
  return res.status(500).json({ message: "Erreur serveur lors de l'accès à la comptabilité." });
}

// READ: toutes les opérations de l'entreprise connectée
router.get("/", async (req, res) => {
  try {
    const id = entrepriseId(req);
    if (!id) return res.status(401).json({ message: "Session invalide." });
    const operations = await Comptabilite.find({ idEntreprise: id }).sort({ date: -1, createdAt: -1 }).lean();
    return res.json(operations);
  } catch (erreur) {
    return gererErreur(res, erreur);
  }
});

// READ: opérations entre deux dates (YYYY-MM-DD incluses)
router.get("/periode", async (req, res) => {
  try {
    const id = entrepriseId(req);
    if (!id) return res.status(401).json({ message: "Session invalide." });
    const { debut, fin } = req.query;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(debut || "") || !dateRe.test(fin || "") || debut > fin) {
      return res.status(400).json({ message: "Période invalide." });
    }
    const operations = await Comptabilite.find({
      idEntreprise: id,
      date: { $gte: debut, $lte: fin }
    }).sort({ date: -1, createdAt: -1 }).lean();
    return res.json(operations);
  } catch (erreur) {
    return gererErreur(res, erreur);
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const id = entrepriseId(req);
    if (!id) return res.status(401).json({ message: "Session invalide." });
    const resultat = validerOperation(req.body || {});
    if (resultat.erreur) return res.status(400).json({ message: resultat.erreur });
    const operation = await Comptabilite.create({ ...resultat.donnees, idEntreprise: id });
    return res.status(201).json(operation);
  } catch (erreur) {
    return gererErreur(res, erreur);
  }
});

// UPDATE: seuls les champs autorisés sont modifiables, dans l'entreprise courante
router.put("/:id", async (req, res) => {
  try {
    const id = entrepriseId(req);
    if (!id) return res.status(401).json({ message: "Session invalide." });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Identifiant invalide." });
    }
    const resultat = validerOperation(req.body || {});
    if (resultat.erreur) return res.status(400).json({ message: resultat.erreur });
    const operation = await Comptabilite.findOneAndUpdate(
      { _id: req.params.id, idEntreprise: id },
      { $set: resultat.donnees },
      { new: true, runValidators: true }
    );
    if (!operation) return res.status(404).json({ message: "Opération introuvable." });
    return res.json(operation);
  } catch (erreur) {
    return gererErreur(res, erreur);
  }
});

// DELETE: suppression limitée à l'entreprise courante
router.delete("/:id", async (req, res) => {
  try {
    const id = entrepriseId(req);
    if (!id) return res.status(401).json({ message: "Session invalide." });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Identifiant invalide." });
    }
    const operation = await Comptabilite.findOneAndDelete({ _id: req.params.id, idEntreprise: id });
    if (!operation) return res.status(404).json({ message: "Opération introuvable." });
    return res.json({ message: "Opération supprimée." });
  } catch (erreur) {
    return gererErreur(res, erreur);
  }
});

module.exports = router;
