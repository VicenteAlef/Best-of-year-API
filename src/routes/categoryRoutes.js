const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// Rota Pública (mas precisa estar logado para ver as opções de voto)
router.get("/", verifyToken, categoryController.listCategories);

// Rotas de Admin (Criar, Indicar, Excluir)
router.post("/", verifyToken, isAdmin, categoryController.createCategory);
router.delete("/:id", verifyToken, isAdmin, categoryController.deleteCategory);

// Gerir Candidatos
router.post("/nominee", verifyToken, isAdmin, categoryController.addNominee); // Body: { categoryId, userId }
router.delete(
  "/:categoryId/nominee/:userId",
  verifyToken,
  isAdmin,
  categoryController.removeNominee
);

module.exports = router;
