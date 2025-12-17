const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// Rota de Votar (Qualquer utilizador logado)
router.post("/", verifyToken, voteController.registerVote);

// Rota de Resultados (Apenas Admin)
router.get("/results", verifyToken, isAdmin, voteController.getResults);

module.exports = router;
