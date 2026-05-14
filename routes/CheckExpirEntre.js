// routes/CheckExpirEntre.js

// ⚠️ Adapte ce chemin selon l'emplacement réel de ton modèle.
// Si ton modèle Entreprise.js est dans routes/, garde "./Entreprise".
// S'il est dans models/, remplace par "../models/Entreprise".
const Entreprise = require("./Entreprise");

// ======================
// Vérifie si l'entreprise est expirée
// ======================
function isExpired(entreprise) {
    const createdAt = new Date(entreprise.createdAt);

    // Date d'expiration = createdAt + duration jours
    const expireAt = new Date(createdAt);
    expireAt.setDate(
        expireAt.getDate() + (entreprise.duration || 7)
    );

    // Retourne true si la date actuelle dépasse la date d'expiration
    return new Date() > expireAt;
}

// ======================
// Middleware principal
// ======================
async function CheckExpirEntre(req, res, next) {
    try {
        // 1. Vérifier que la session existe
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Session invalide"
            });
        }

        // 2. Vérifier que l'utilisateur possède une entreprise
        const entrepriseId = req.session.user.entrepriseId;

        if (!entrepriseId) {
            return res.status(401).json({
                success: false,
                message: "Aucune entreprise associée"
            });
        }

        // 3. Rechercher l'entreprise dans MongoDB
        const entreprise = await Entreprise.findById(entrepriseId);

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: "Entreprise introuvable"
            });
        }

        // 4. Vérifier si l'abonnement a expiré
        if (isExpired(entreprise)) {
            return res.status(403).json({
                success: false,
                expired: true,
                message: "Votre abonnement a expiré"
            });
        }

        // 5. Mettre l'entreprise à disposition des routes suivantes
        req.entreprise = entreprise;

        // 6. Continuer vers la route demandée
        next();

    } catch (error) {
        console.error("Erreur CheckExpirEntre :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
}

// Export du middleware
module.exports = CheckExpirEntre;