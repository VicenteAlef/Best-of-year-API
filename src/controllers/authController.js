const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { openDb } = require("../config/db");
require("dotenv").config();

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    const db = await openDb();

    // Busca o usuário pelo email
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    // Se não achar usuário
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Compara a senha enviada com o hash no banco
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Se tudo ok, gera o Token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name }, // Payload (dados dentro do token)
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // Token expira em 8 horas (jornada de trabalho)
    );

    // Retorna dados básicos e o token
    res.json({
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        voted: user.voted === 1, // Converte 1/0 para true/false
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};
