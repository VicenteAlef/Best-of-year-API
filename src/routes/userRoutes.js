const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../config/upload");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// Todas as rotas abaixo requerem Autenticação E permissão de Admin
router.use(verifyToken, isAdmin);

// Listar
router.get("/", userController.listUsers);

// Criar (Com upload de foto opcional)
// 'photo' é o nome do campo que deve vir no Form-Data do frontend
router.post("/", upload.single("photo"), userController.createUser);

// Editar
router.put("/:id", upload.single("photo"), userController.updateUser);

// Excluir
router.delete("/:id", userController.deleteUser);

module.exports = router;
