function isLoggedIn(req, res, next) {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message: "Accès refusé"
        });

    }

    next();
}

module.exports = {
    isLoggedIn
};