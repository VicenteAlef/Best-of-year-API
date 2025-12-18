const { openDb } = require("../config/db");

// Registar Votos
exports.registerVote = async (req, res) => {
  const userId = req.user.id; // Quem está a votar (vem do Token)
  const { votes } = req.body; // Array de objetos: [{ categoryId, nomineeId }, ...]

  if (!votes || !Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ message: "Nenhum voto enviado." });
  }

  try {
    const db = await openDb();

    // 1. Verificar se o utilizador já votou
    const user = await db.get("SELECT voted FROM users WHERE id = ?", [userId]);
    if (user.voted === 1) {
      return res.status(403).json({ message: "Você já votou este ano." });
    }

    // 2. Verificar se votou em TODAS as categorias existentes
    const categories = await db.all("SELECT id FROM categories");
    if (votes.length !== categories.length) {
      return res
        .status(400)
        .json({ message: "É obrigatório votar em todas as categorias." });
    }

    // 3. Validações Individuais (Auto-voto e validade do candidato)
    for (const vote of votes) {
      const nominee = await db.get(
        "SELECT user_id FROM nominees WHERE id = ?",
        [vote.nomineeId]
      );

      if (!nominee) {
        return res.status(400).json({
          message: `Candidato inválido para a categoria ${vote.categoryId}.`,
        });
      }

      // Regra: Não votar em si mesmo
      if (nominee.user_id === userId) {
        return res
          .status(400)
          .json({ message: "Não é permitido votar em si mesmo." });
      }
    }

    // 4. Salvar os votos (Inserção em massa seria ideal, mas loop é ok para sqlite local)
    // Dica: Em produção, usaríamos uma transação (BEGIN TRANSACTION... COMMIT)
    for (const vote of votes) {
      await db.run(
        "INSERT INTO votes (voter_id, category_id, nominee_id) VALUES (?, ?, ?)",
        [userId, vote.categoryId, vote.nomineeId]
      );
    }

    // 5. Marcar utilizador como "Já Votou"
    await db.run("UPDATE users SET voted = 1 WHERE id = ?", [userId]);

    res.json({ message: "Votos confirmados com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao processar votos." });
  }
};

// Relatório de Resultados (Apenas Admin)
exports.getResults = async (req, res) => {
  try {
    const db = await openDb();

    const results = await db.all(`
      SELECT 
        c.title as category_title,
        u.name as nominee_name,
        u.photo_path as nominee_photo,
        COUNT(v.id) as total_votes
      FROM categories c
      JOIN nominees n ON c.id = n.category_id
      JOIN users u ON n.user_id = u.id
      LEFT JOIN votes v ON n.id = v.nominee_id
      GROUP BY c.id, n.id
      ORDER BY c.id, total_votes DESC
    `);

    // Agrupar visualmente para o frontend (opcional, mas ajuda)
    // O formato atual retorna uma lista plana ordenada. O Frontend pode tratar isso.
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao obter resultados." });
  }
};

// Resetar Votação (Para novo concurso)
exports.resetVotes = async (req, res) => {
  try {
    const db = await openDb();

    // 1. Apagar todos os votos registados
    await db.run("DELETE FROM votes");

    // 2. Resetar o status de "já votou" de TODOS os utilizadores
    await db.run("UPDATE users SET voted = 0");

    res.json({
      message:
        "Sistema de votação resetado com sucesso! Um novo concurso foi iniciado.",
    });
  } catch (error) {
    console.error("Erro ao resetar votos:", error);
    res.status(500).json({ message: "Erro ao resetar votação." });
  }
};
