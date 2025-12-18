const { openDb } = require("../config/db");

// Criar Categoria
exports.createCategory = async (req, res) => {
  const { title } = req.body;

  if (!title)
    return res.status(400).json({ message: "O título é obrigatório." });

  try {
    const db = await openDb();
    await db.run("INSERT INTO categories (title) VALUES (?)", [title]);
    res.status(201).json({ message: "Categoria criada com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar categoria." });
  }
};

// Listar Categorias com seus Candidatos (Formato ideal para o Frontend)
// ... (outros imports e funções)

// Listar Categorias com seus Candidatos (CORRIGIDO)
exports.listCategories = async (req, res) => {
  try {
    const db = await openDb();

    // ATENÇÃO: Adicionamos 'n.id as nominee_id' na primeira linha do SELECT
    const rows = await db.all(`
      SELECT 
        n.id as nominee_id,
        c.id as category_id, 
        c.title as category_title,
        u.id as user_id, 
        u.name as user_name, 
        u.photo_path
      FROM categories c
      LEFT JOIN nominees n ON c.id = n.category_id
      LEFT JOIN users u ON n.user_id = u.id
    `);

    const categoriesMap = new Map();

    rows.forEach((row) => {
      if (!categoriesMap.has(row.category_id)) {
        categoriesMap.set(row.category_id, {
          id: row.category_id,
          title: row.category_title,
          nominees: [],
        });
      }

      if (row.user_id) {
        categoriesMap.get(row.category_id).nominees.push({
          nominee_id: row.nominee_id, // <--- O FRONTEND PRECISA DISTO AQUI
          user_id: row.user_id,
          name: row.user_name,
          photo: row.photo_path,
        });
      }
    });

    const result = Array.from(categoriesMap.values());
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar categorias." });
  }
};

// Indicar um Usuário a uma Categoria
exports.addNominee = async (req, res) => {
  const { categoryId, userId } = req.body;

  try {
    const db = await openDb();

    // Verifica se já não foi indicado
    const exists = await db.get(
      "SELECT id FROM nominees WHERE category_id = ? AND user_id = ?",
      [categoryId, userId]
    );

    if (exists) {
      return res
        .status(400)
        .json({ message: "Utilizador já está concorrendo nesta categoria." });
    }

    await db.run("INSERT INTO nominees (category_id, user_id) VALUES (?, ?)", [
      categoryId,
      userId,
    ]);

    res.json({ message: "Candidato adicionado com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao adicionar candidato." });
  }
};

// Remover Candidato da Categoria
exports.removeNominee = async (req, res) => {
  const { categoryId, userId } = req.params;

  try {
    const db = await openDb();
    await db.run("DELETE FROM nominees WHERE category_id = ? AND user_id = ?", [
      categoryId,
      userId,
    ]);
    res.json({ message: "Candidato removido da categoria." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover candidato." });
  }
};

// Excluir Categoria
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await openDb();
    await db.run("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ message: "Categoria excluída." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir categoria." });
  }
};
