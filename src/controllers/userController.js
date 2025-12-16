const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { openDb } = require("../config/db");

// Caminho da pasta de uploads
const UPLOADS_FOLDER = path.resolve(__dirname, "../../public/uploads");

// Função auxiliar para apagar ficheiro antigo
const deleteFile = (filePath) => {
  if (!filePath) return;
  // O caminho no banco vem como '/uploads/foto.jpg'
  const fileName = path.basename(filePath);
  const absolutePath = path.join(UPLOADS_FOLDER, fileName);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const file = req.file;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Nome, email e senha são obrigatórios." });
  }

  try {
    const db = await openDb();

    // Verifica se email já existe
    const userExists = await db.get("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (userExists) {
      return res.status(400).json({ message: "Este email já está em uso." });
    }

    // Processamento da Imagem
    let photoPath = null;
    if (file) {
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const absolutePath = path.join(UPLOADS_FOLDER, fileName);

      // Redimensiona para 400x500 e converte para JPEG
      await sharp(file.buffer)
        .resize(400, 500, { fit: "cover" }) // 'cover' corta o excesso para preencher
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toFile(absolutePath);

      photoPath = `/uploads/${fileName}`; // Caminho relativo para guardar no banco
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.run(
      `INSERT INTO users (name, email, password, role, photo_path) VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, role || "user", photoPath]
    );

    res.status(201).json({ message: "Utilizador criado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar utilizador." });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const db = await openDb();
    // Não retornamos a senha!
    const users = await db.all(
      "SELECT id, name, email, role, photo_path, voted FROM users"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar utilizadores." });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  const file = req.file;

  try {
    const db = await openDb();
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);

    if (!user)
      return res.status(404).json({ message: "Utilizador não encontrado." });

    let newPassword = user.password;
    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    let newPhotoPath = user.photo_path;

    // Se enviou nova foto, apaga a antiga e salva a nova
    if (file) {
      deleteFile(user.photo_path); // Apaga antiga

      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const absolutePath = path.join(UPLOADS_FOLDER, fileName);

      await sharp(file.buffer)
        .resize(400, 500, { fit: "cover" })
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toFile(absolutePath);

      newPhotoPath = `/uploads/${fileName}`;
    }

    await db.run(
      `UPDATE users SET name = ?, email = ?, password = ?, role = ?, photo_path = ? WHERE id = ?`,
      [name, email, newPassword, role, newPhotoPath, id]
    );

    res.json({ message: "Utilizador atualizado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar utilizador." });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  // Impede que o admin se apague a si mesmo
  if (req.user.id == id) {
    return res
      .status(400)
      .json({ message: "Não pode excluir a sua própria conta." });
  }

  try {
    const db = await openDb();
    const user = await db.get("SELECT photo_path FROM users WHERE id = ?", [
      id,
    ]);

    if (!user)
      return res.status(404).json({ message: "Utilizador não encontrado." });

    // Apaga a foto da pasta
    deleteFile(user.photo_path);

    // Apaga do banco
    await db.run("DELETE FROM users WHERE id = ?", [id]);

    res.json({ message: "Utilizador excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir utilizador." });
  }
};
