const express = require("express");
const router = express.Router();

// =======================
// ADMIN (source backend)
// =======================
const ADMIN = {
  entrepriseId: "admin001",
  user: "admin",
  password: "1234"
};

// =======================
// LOGIN ADMIN
// =======================
router.post("/", (req, res) => {

  const { entrepriseId, user, password } = req.body;

  if (
    entrepriseId === ADMIN.entrepriseId &&
    user === ADMIN.user &&
    password === ADMIN.password
  ) {
    return res.json({
      msg: "OK",
      user,
      entrepriseId
    });
  }

  return res.status(401).json({
    msg: "Identifiants incorrects"
  });
});

module.exports = router;