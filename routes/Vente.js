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

    const ventes = await Vente.find(filtre)
      .sort({ date: -1 });

    res.json(ventes);

  } catch (error) {
    console.log("❌ ERREUR GET VENTES:", error);
    res.status(500).json({
      error: error.message
    });
  }
});











// =========================
// 🔥 TOP PRODUITS VENDUS
// =========================
router.get("/top-produits", async (req, res) => {

  try {

    const {
      idEntreprise,
      dateDebut,
      dateFin
    } = req.query;

    if (!idEntreprise) {
      return res.status(400).json({
        message: "idEntreprise requis"
      });
    }

    // =========================
    // FILTRE DATE
    // =========================
    const match = {
      idEntreprise
    };

    if (dateDebut || dateFin) {

      match.date = {};

      if (dateDebut) {
        match.date.$gte = new Date(dateDebut + "T00:00:00");
      }

      if (dateFin) {
        match.date.$lte = new Date(dateFin + "T23:59:59.999");
      }
    }

    // =========================
    // AGGREGATE
    // =========================
    const produits = await Vente.aggregate([

      // filtre entreprise + date
      {
        $match: match
      },

      // ouvrir tableau produits
      {
        $unwind: "$produits"
      },

      // grouper par nom produit
      {
        $group: {

          _id: "$produits.nom",

          totalQuantite: {
            $sum: "$produits.quantite"
          },

          totalVentes: {
            $sum: "$produits.total"
          }

        }
      },

      // trier du plus vendu
      {
        $sort: {
          totalQuantite: -1
        }
      },

      // limiter
      {
        $limit: 10
      }

    ]);

    res.json(produits);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });

  }

});



// =========================
// 📉 MOINS VENDUS
// =========================
router.get("/moins-vendus", async (req, res) => {

  try {

    const {
      idEntreprise,
      dateDebut,
      dateFin
    } = req.query;

    if (!idEntreprise) {
      return res.status(400).json({
        message: "idEntreprise requis"
      });
    }

    const match = {
      idEntreprise
    };

    if (dateDebut || dateFin) {

      match.date = {};

      if (dateDebut) {
        match.date.$gte = new Date(dateDebut + "T00:00:00");
      }

      if (dateFin) {
        match.date.$lte = new Date(dateFin + "T23:59:59.999");
      }

    }

    const produits = await Vente.aggregate([

      {
        $match: match
      },

      {
        $unwind: "$produits"
      },

      {
        $group: {

          _id: "$produits.nom",

          totalQuantite: {
            $sum: "$produits.quantite"
          },

          totalVentes: {
            $sum: "$produits.total"
          }

        }
      },

      // ordre croissant
      {
        $sort: {
          totalQuantite: 1
        }
      },

      {
        $limit: 10
      }

    ]);

    res.json(produits);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });

  }

});





module.exports = router;