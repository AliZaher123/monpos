require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// DB
const connectDB = require("./db");
connectDB();

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// STATIC
app.use(express.static(path.join(__dirname, "public")));

// ROUTES
app.use("/categorie", require("./routes/categorie"));
app.use("/stock", require("./routes/Stock"));
app.use("/taux", require("./routes/Taux Devise"));
app.use("/tva", require("./routes/Taux TVA"));
app.use("/users", require("./routes/users"));
app.use("/login", require("./routes/Login"));
app.use("/ventes", require("./routes/Vente"));
app.use("/entreprises", require("./routes/Entreprise"));
app.use("/api/ticket", require("./routes/Ticket"));
app.use("/api", require("./routes/RapportVente"));
app.use("/login-admin", require("./routes/Loginadmin"));

// HOME
app.get("*", (req, res) => {
  if (req.path.endsWith(".html")) {
    return res.sendFile(path.join(__dirname, "public", req.path));
  }
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur lancé sur " + PORT);
});