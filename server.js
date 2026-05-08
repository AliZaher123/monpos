require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");

const app = express();

// ======================
// DB
// ======================
const connectDB = require("./db");
connectDB();

// ======================
// MIDDLEWARE LOGIN
// ======================
const { isLoggedIn } = require("./middleware");

app.set("trust proxy", 1);

// ======================
// SESSION (IMPORTANT: EN HAUT)
// ======================
app.use(session({
  secret: "monsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
   secure: true,
    httpOnly: true,
    sameSite: "none"
  }
}));

// ======================
// CORS
// ======================
app.use(cors({
  origin: true,
  credentials: true
}));

// ======================
// BODY PARSER
// ======================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ======================
// STATIC FILES
// ======================
app.use(express.static(path.join(__dirname, "public")));






// ======================
// TEST SESSION
// ======================

app.get("/test-session", (req, res) => {

  req.session.test = "OK";

  res.send("Session créée");

});

app.get("/check-session", (req, res) => {

  res.send(req.session.test || "Pas de session");

});


// ======================
// TEST SESSION (OU ROUTE /ME)
// ======================

app.get("/me", (req, res) => {

  res.json({
    session: req.session
  });

});













// ======================
// ROUTES PUBLIQUES
// ======================
app.use("/login", require("./routes/Login"));
app.use("/login-admin", require("./routes/Loginadmin"));
app.use("/entreprises", require("./routes/Entreprise"));

// ======================
// ROUTES PROTÉGÉES (POS)
// ======================
app.use("/stock", isLoggedIn, require("./routes/Stock"));
app.use("/ventes", isLoggedIn, require("./routes/Vente"));
app.use("/categorie", isLoggedIn, require("./routes/categorie"));
app.use("/users", isLoggedIn, require("./routes/users"));
app.use("/taux", isLoggedIn, require("./routes/Taux Devise"));
app.use("/tva", isLoggedIn, require("./routes/Taux TVA"));
app.use("/api/ticket", isLoggedIn, require("./routes/Ticket"));
app.use("/api", isLoggedIn, require("./routes/RapportVente"));

// ======================
// TEST ROUTE PROTÉGÉE
// ======================
app.get("/api/products", isLoggedIn, async (req, res) => {
  res.send("Route protégée");
});

// ======================
// HOME PAGE
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Login.html"));
});

// ======================
// 404
// ======================
app.use((req, res) => {
  res.status(404).send("Page non trouvée");
});

// ======================
// SERVER START
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur lancé sur " + PORT);
});