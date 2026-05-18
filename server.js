require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default || require("connect-mongo");
const cors = require("cors");

const app = express();

// ======================
// DB CONNECTION
// ======================
const connectDB = require("./db");
connectDB();

// ======================
// AUTH MIDDLEWARE
// ======================
const { isLoggedIn } = require("./middleware");
const verifyAdmin = require("./middlewareadmin");

// ======================
// TRUST PROXY (IMPORTANT RENDER / HTTPS)
// ======================
app.set("trust proxy", 1);

// ======================
// BODY PARSER (AVANT ROUTES)
// ======================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ======================
// CORS (AVANT SESSION)
// ======================
app.use(cors({
  origin: true,
  credentials: true
}));

// ======================
// SESSION CONFIG (IMPORTANT)
// ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "monsecret",

    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      ttl: 24 * 60 * 60
    }),

    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// ======================
// STATIC FILES
// ======================
app.use(express.static(path.join(__dirname, "public")));








app.get("/check-session", (req, res) => {

  if (req.session && req.session.user) {
    return res.json({
      active: true,
      user: req.session.user
    });
  }

  return res.status(401).json({
    active: false
  });

});







app.get("/me", (req, res) => {

  console.log("ME sessionID:", req.sessionID);

  res.json({
    sessionID: req.sessionID,
    user: req.session.user || null,
    admin: req.session.admin || null,
    cookies: req.headers.cookie
  });
});






// ======================
// ME ROUTE (DEBUG)
// ======================
app.get("/mes", (req, res) => {

  console.log("ME sessionID:", req.sessionID);
  console.log("ME user:", req.session.user);

  res.json({
    sessionID: req.sessionID,
    cookies: req.headers.cookie,
    user: req.session.user || null
  });
});

// ======================
// PUBLIC ROUTES
// ======================
app.use("/login", require("./routes/Login"));
app.use("/logout", require("./routes/Logout"));

app.use("/login-admin", require("./routes/Loginadmin"));
app.use("/api", require("./routes/Logoutadmin")); // 👈 AJOUT
app.use("/entreprises", verifyAdmin, require("./routes/Entreprise"));
app.use("/api/ticket", require("./routes/Ticket"));


// ======================
// PROTECTED ROUTES
// ======================
app.use("/stock", isLoggedIn, require("./routes/Stock"));
app.use("/ventes", isLoggedIn, require("./routes/Vente"));
app.use("/categorie", isLoggedIn, require("./routes/categorie"));
app.use("/users", isLoggedIn, require("./routes/users"));
app.use("/taux", isLoggedIn, require("./routes/Taux Devise"));
app.use("/tva", isLoggedIn, require("./routes/Taux TVA"));
app.use("/api", isLoggedIn, require("./routes/RapportVente"));
app.use("/api/remboursement", isLoggedIn, require("./routes/RemboursementTicket"));

// ======================
// TEST PROTECTED ROUTE
// ======================
app.get("/api/products", isLoggedIn, (req, res) => {
  res.send("Route protégée");
});

// ======================
// HOME
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
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});