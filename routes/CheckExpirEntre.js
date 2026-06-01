// routes/CheckExpirEntre.js

const Entreprise = require("./Entreprise"); 
// ⚠️ adapte si ton modèle est dans ../models/Entreprise

// ======================
// 🔥 EXPIRATION LOGIC (SAME AS LOGIN)
// ======================
function isExpired(entreprise) {

    if (!entreprise) return true;

    const createdAt = entreprise.createdAt
        ? new Date(entreprise.createdAt)
        : new Date();

    const duration = Number(entreprise.duration ?? 7);

    const expireAt = new Date(createdAt);
    expireAt.setDate(expireAt.getDate() + duration);

    return new Date() > expireAt;
}

// ======================
// 🛡️ MIDDLEWARE PROTECTOR
// ======================
async function CheckExpirEntre(req, res, next) {

    try {

        // ======================
        // 🔐 CHECK SESSION
        // ======================
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Session invalide"
            });
        }

        const entrepriseId = req.session.user.entrepriseId;

        if (!entrepriseId) {
            return res.status(401).json({
                success: false,
                message: "Entreprise non définie"
            });
        }

        // ======================
        // 🔎 FETCH ENTREPRISE
        // ======================
        const entreprise = await Entreprise.findById(entrepriseId);

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: "Entreprise introuvable"
            });
        }

        // ======================
        // ⛔ EXPIRATION CHECK
        // ======================
        if (isExpired(entreprise)) {

            return res.status(403).json({
                success: false,
                expired: true,
                message: "Votre abonnement a expiré"
            });
        }

        // ======================
        // 📦 ATTACH DATA
        // ======================
        req.entreprise = entreprise;

        // ======================
        // ✅ CONTINUE
        // ======================
        next();

    } catch (error) {

        console.error("CheckExpirEntre error:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur serveur"
        });
    }
}

module.exports = CheckExpirEntre;