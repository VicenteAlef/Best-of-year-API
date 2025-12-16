const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDb } = require("./config/db");

const app = express();

// Middlewares
app.use(cors()); // Permite conexões do Frontend
app.use(express.json()); // Permite ler JSON no body

// Servir arquivos estáticos (fotos dos usuários)
// Acessível em: http://localhost:3000/uploads/nome-da-foto.jpg
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../public/uploads"))
);

// Inicializa o Banco de Dados ao subir a aplicação
initDb().catch((err) => console.error("Erro ao iniciar DB:", err));

// Rotas (vamos adicionar na próxima etapa)
app.get("/", (req, res) => {
  res.send("API Melhores do Ano rodando...");
});

module.exports = app;
