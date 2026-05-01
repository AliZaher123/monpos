const express = require("express"); 
// 🔵 On importe Express (framework pour créer le serveur)

const router = express.Router(); 
// 🔵 On crée un routeur (permet de gérer les routes séparément)

const mongoose = require("mongoose"); 
// 🔵 On importe Mongoose (pour communiquer avec MongoDB)


// ======================
// 🧠 MODEL CATEGORIE
// ======================
const Categorie = mongoose.model("Categorie", {
  nom: String, 
  // 📌 nom de la catégorie (ex: Boisson, Aliment, etc.)

  idEntreprise: String 
  // 📌 identifiant de l'entreprise (TRÈS IMPORTANT pour SaaS)
});


// ======================
// ➕ AJOUTER UNE CATEGORIE
// ======================
router.post("/", async (req, res) => {
  try {

    // 📥 On récupère les données envoyées depuis le frontend
    const { nom, idEntreprise } = req.body;

    // ❌ Vérification si les données sont manquantes
    if (!nom || !idEntreprise) {
      return res.status(400).json({ message: "Données manquantes" });
    }

    // 🟢 Création de la catégorie dans MongoDB
    const data = await Categorie.create({
      nom,
      idEntreprise
    });

    // 📤 On renvoie la catégorie créée
    res.json(data);

  } catch (err) {
    // ❌ Gestion des erreurs serveur
    res.status(500).json({ message: err.message });
  }
});


// ======================
// 📥 RECUPERER LES CATEGORIES (PAR ENTREPRISE)
// ======================
router.get("/", async (req, res) => {
  try {

    // 📥 On récupère idEntreprise depuis l'URL (query)
    // Exemple: /categorie?idEntreprise=ENT123
    const { idEntreprise } = req.query;

    // ❌ Si idEntreprise n'est pas envoyé
    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    // 🟢 On récupère UNIQUEMENT les catégories de cette entreprise
    const data = await Categorie.find({ idEntreprise });

    // 📤 On renvoie les données
    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================
// ❌ SUPPRIMER UNE CATEGORIE (SECURISÉ)
// ======================
router.delete("/:id", async (req, res) => {
  try {

    // 📥 On récupère l'id de la catégorie dans l'URL
    const id = req.params.id;

    // 📥 On récupère idEntreprise depuis l'URL
    const { idEntreprise } = req.query;

    // ❌ Vérification
    if (!idEntreprise) {
      return res.status(400).json({ message: "idEntreprise requis" });
    }

    // 🔒 IMPORTANT :
    // On vérifie que la catégorie appartient à cette entreprise
    const cat = await Categorie.findOne({ _id: id, idEntreprise });

    // ❌ Si la catégorie n'existe pas ou ne correspond pas
    if (!cat) {
      return res.status(404).json({ message: "Non autorisé ou introuvable" });
    }

    // 🗑 Suppression
    await Categorie.findByIdAndDelete(id);

    // 📤 Réponse
    res.json({ message: "Catégorie supprimée" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================
// 🔵 EXPORT DU ROUTER
// ======================
module.exports = router;