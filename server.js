require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default || require("connect-mongo");
const cors = require("cors");

const app = express();

// ======================
// CONNEXION BASE DE DONNÉES
// ======================
const connectDB = require("./db");
connectDB();

// ======================
// MIDDLEWARE D'AUTHENTIFICATION
// ======================
const { isLoggedIn } = require("./middleware");

// ======================
// TRUST PROXY (IMPORTANT SI HTTPS VIA NGINX/APACHE/CLOUDFLARE)
// ======================
app.set("trust proxy", 1);

// ======================
// SESSION
// IMPORTANT : DOIT ÊTRE AVANT LES ROUTES
// ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "monsecret",
    resave: false,
    saveUninitialized: false,

    // Stockage des sessions dans MongoDB
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL
    }),

    // Configuration du cookie
    cookie: {
      secure: true,          // HTTPS obligatoire
      httpOnly: true,        // Cookie inaccessible via JavaScript
      sameSite: "none",      // Requis pour frontend/backend sur origines différentes
      maxAge: 1000 * 60 * 60 * 24 // 24 heures
    }
  })
);

// ======================
// CORS
// IMPORTANT : credentials doit être true
// ======================
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// ======================
// BODY PARSER
// ======================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ======================
// FICHIERS STATIQUES (public)
// ======================
app.use(express.static(path.join(__dirname, "public")));

// ======================
// ROUTES DE TEST SESSION
// ======================
app.get("/test-session", (req, res) => {
  req.session.test = "OK";

  req.session.save((err) => {
    if (err) {
      return res.status(500).send("Erreur session");
    }

    res.send("Session créée");
  });
});

app.get("/check-session", (req, res) => {
  res.send(req.session.test || "Pas de session");
});

// ======================
// ROUTE /ME
// Permet de vérifier l'utilisateur connecté
// ======================
app.get("/me", (req, res) => {
  res.json({
    sessionID: req.sessionID,
    user: req.session.user || null,
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
// ROUTE DE TEST PROTÉGÉE
// ======================
app.get("/api/products", isLoggedIn, (req, res) => {
  res.send("Route protégée");
});

// ======================
// PAGE D'ACCUEIL
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Login.html"));
});

// ======================
// 404 - PAGE NON TROUVÉE
// ======================
app.use((req, res) => {
  res.status(404).send("Page non trouvée");
});

// ======================
// DÉMARRAGE DU SERVEUR
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});