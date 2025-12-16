const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verifica se o usuário tem um token válido
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // O token vem geralmente como "Bearer eyJhbGci..."
  // Precisamos pegar apenas a parte do código (o segundo item do split)
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Token não fornecido." });
  }

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    // Salva os dados do usuário na requisição para uso posterior
    req.user = decoded;

    next(); // Pode passar para a próxima função (a rota em si)
  } catch (err) {
    return res.status(403).json({ message: "Token inválido ou expirado." });
  }
};

// Verifica se o usuário é ADMIN (deve ser usado DEPOIS do verifyToken)
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Acesso restrito apenas para Administradores." });
  }
};
