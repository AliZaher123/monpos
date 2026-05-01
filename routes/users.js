const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Schema directement ici
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

// Model
const User = mongoose.models.User || mongoose.model("User", userSchema);


router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Utilisateur existe déjà" });
    }

    const user = new User({
      username,
      password,
      role: role || "user"
    });

    await user.save();

    res.json({
      message: "Utilisateur créé",
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




module.exports = router;