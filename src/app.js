const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDb } = require("./config/db");

// Importar rotas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../public/uploads"))
);

initDb().catch((err) => console.error("Erro ao iniciar DB:", err));

// Usar Rotas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("API Melhores do Ano rodando...");
});

module.exports = app;
