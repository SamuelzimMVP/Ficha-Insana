import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();         // Carrega e processa o arquivo .env
import express from "express";      // Requisição do pacote do express
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();              // Instancia o Express
const port = 3000;                  // Define a porta
const { Pool } = pkg; // Obtém o construtor Pool do pacote pg para gerenciar conexões com o banco de dados PostgreSQL
let pool = null; // Variável para armazenar o pool de conexões com o banco de dados

const JWT_SECRET = process.env.JWT_SECRET || "ficha_insana_secret_key_2024";

app.use(cors());

app.use(express.json());

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

// Middleware opcional (não bloqueia se não tiver token)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      req.userEmail = decoded.email;
    } catch (err) {
      // Token inválido, continua sem usuário
    }
  }
  next();
}

// ==========================
// ROTAS DE AUTENTICAÇÃO
// ==========================

// Registro
app.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ erro: "Nome de usuário e senha são obrigatórios" });
    }

    if (password.length < 4) {
      return res.status(400).json({ erro: "Senha deve ter pelo menos 4 caracteres" });
    }

    if (username.length < 3) {
      return res.status(400).json({ erro: "Nome de usuário deve ter pelo menos 3 caracteres" });
    }

    const db = conectarBD();

    // Verifica se username já existe
    const existing = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ erro: "Nome de usuário já existe" });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria usuário
    const result = await db.query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [username, passwordHash, email || null]
    );

    const user = result.rows[0];

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (e) {
    console.error("Erro ao registrar usuário:", e);
    res.status(500).json({ erro: "Erro interno ao registrar usuário" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ erro: "Nome de usuário e senha são obrigatórios" });
    }

    const db = conectarBD();

    // Busca usuário pelo username
    const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    const user = result.rows[0];

    // Verifica senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login realizado com sucesso",
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (e) {
    console.error("Erro ao fazer login:", e);
    res.status(500).json({ erro: "Erro interno ao fazer login" });
  }
});

// Obter dados do usuário logado
app.get("/me", authMiddleware, async (req, res) => {
  try {
    const db = conectarBD();
    const result = await db.query(
      "SELECT id, email, name, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("Erro ao buscar dados do usuário:", e);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// Atualizar perfil
app.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, password } = req.body;
    const db = conectarBD();

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ erro: "Senha deve ter pelo menos 6 caracteres" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET name = $1, password_hash = $2 WHERE id = $3",
        [name, passwordHash, req.userId]
      );
    } else {
      await db.query(
        "UPDATE users SET name = $1 WHERE id = $2",
        [name, req.userId]
      );
    }

    res.json({ message: "Perfil atualizado com sucesso" });
  } catch (e) {
    console.error("Erro ao atualizar perfil:", e);
    res.status(500).json({ erro: "Erro interno" });
  }
});
// Função para obter uma conexão com o banco de dados
function conectarBD() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.URL_BD,
    });
  }
  return pool;
}

app.get("/", async (req, res) => {        // Cria endpoint na rota da raiz do projeto
  const db = new Pool({
    connectionString: process.env.URL_BD,
  });

  let dbStatus = "ok";
  try {
    await db.query("SELECT 1");
  } catch (e) {
    dbStatus = e.message;
  }
  console.log("Rota GET / solicitada");
  res.json({
    message: "API para Enricar",      // Substitua pelo conteúdo da sua API
    author: "Samuel R. Caroba",    // Substitua pelo seu nome
    statusBD: dbStatus   // Acrescente esta linha
  });
});
app.get("/personagens", optionalAuth, async (req, res) => {
  console.log("Rota GET /personagens solicitada");
  try {
    const db = conectarBD();
    
    if (req.userId) {
      // Usuário logado: retorna apenas os personagens dele
      const resultado = await db.query(
        "SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC",
        [req.userId]
      );
      return res.json(resultado.rows);
    }
    
    // Usuário não logado: retorna todos (compatibilidade)
    const resultado = await db.query("SELECT * FROM characters ORDER BY created_at DESC");
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar personagens:", e);
    res.status(500).json({ erro: "Erro interno ao buscar personagens" });
  }
});
app.get("/personagens/:id", optionalAuth, async (req, res) => {
  console.log("Rota GET /personagens/:id solicitada");
  try {
    const id = Number(req.params.id);
    const db = conectarBD();

    const personagem = await db.query(
      "SELECT * FROM characters WHERE id = $1",
      [id]
    );

    if (personagem.rows.length === 0) {
      return res.status(404).json({ mensagem: "Personagem não encontrado" });
    }

    const char = personagem.rows[0];

    // Se usuário está logado, verifica se o personagem é dele
    if (req.userId && char.user_id !== req.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    const skills = await db.query(`
      SELECT s.name, cs.value
      FROM character_skills cs
      JOIN skills s ON s.id = cs.skill_id
      WHERE cs.character_id = $1
    `, [id]);

    const attacks = await db.query(`
      SELECT * FROM attacks WHERE character_id = $1
    `, [id]);

    for (let atk of attacks.rows) {
      const dice = await db.query(
        "SELECT quantity, sides FROM attack_dice WHERE attack_id = $1",
        [atk.id]
      );
      atk.dice = dice.rows;
    }

    res.json({
      ...char,
      skills: skills.rows,
      attacks: attacks.rows
    });
  } catch (e) {
    console.error("Erro ao buscar personagem:", e);
    res.status(500).json({ erro: "Erro interno ao buscar personagem" });
  }
});
app.post("/personagens", optionalAuth, async (req, res) => {
  console.log("Rota POST /personagens solicitada");
  try {
    const {
      name,
      hpCurrent,
      hpMax,
      sanityCurrent,
      sanityMax,
      manaBlocks,
      skills,
      attacks
    } = req.body;

    if (!name) {
      return res.status(400).json({ erro: "Nome é obrigatório" });
    }

    const db = conectarBD();
    const userId = req.userId || null;

    const personagem = await db.query(`
      INSERT INTO characters
      (name, hp_current, hp_max, sanity_current, sanity_max, mana_blocks, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [
      name,
      hpCurrent ?? 100,
      hpMax ?? 100,
      sanityCurrent ?? 100,
      sanityMax ?? 100,
      manaBlocks ?? 0,
      userId
    ]);

    const characterId = personagem.rows[0].id;

    // Salvar perícias
    for (const skillName in skills) {
      await db.query(`
        INSERT INTO character_skills (character_id, skill_id, value)
        SELECT $1, id, $2 FROM skills WHERE name = $3
      `, [characterId, skills[skillName], skillName]);
    }

    // Salvar ataques
    for (const atk of attacks || []) {
      const attack = await db.query(`
        INSERT INTO attacks (character_id, name, description, flat_damage)
        VALUES ($1,$2,$3,$4)
        RETURNING id
      `, [characterId, atk.name, atk.desc, atk.flat]);

      for (const d of atk.dice) {
        await db.query(`
          INSERT INTO attack_dice (attack_id, quantity, sides)
          VALUES ($1,$2,$3)
        `, [attack.rows[0].id, d.qty, d.sides]);
      }
    }

    res.status(201).json({ 
      id: characterId,
      mensagem: "Personagem criado com sucesso!" 
    });
  } catch (e) {
    console.error("Erro ao criar personagem:", e);
    res.status(500).json({ erro: "Erro interno ao criar personagem" });
  }
});
app.put("/personagens/:id", optionalAuth, async (req, res) => {
  console.log("Rota PUT /personagens/:id solicitada");
  try {
    const id = Number(req.params.id);

    const db = conectarBD();

    const atual = await db.query(
      "SELECT * FROM characters WHERE id = $1",
      [id]
    );

    if (atual.rows.length === 0) {
      return res.status(404).json({ mensagem: "Personagem não encontrado" });
    }

    const p = atual.rows[0];

    // Se usuário está logado, verifica se o personagem é dele
    if (req.userId && p.user_id !== req.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    const data = req.body;

    await db.query(`
      UPDATE characters SET
        name = $1,
        hp_current = $2,
        hp_max = $3,
        sanity_current = $4,
        sanity_max = $5,
        mana_blocks = $6,
        updated_at = now()
      WHERE id = $7
    `, [
      data.name ?? p.name,
      data.hpCurrent ?? p.hp_current,
      data.hpMax ?? p.hp_max,
      data.sanityCurrent ?? p.sanity_current,
      data.sanityMax ?? p.sanity_max,
      data.manaBlocks ?? p.mana_blocks,
      id
    ]);

    res.json({ mensagem: "Personagem atualizado com sucesso!" });
  } catch (e) {
    console.error("Erro ao atualizar personagem:", e);
    res.status(500).json({ erro: "Erro interno ao atualizar personagem" });
  }
});
app.delete("/personagens/:id", optionalAuth, async (req, res) => {
  console.log("Rota DELETE /personagens/:id solicitada");
  try {
    const id = Number(req.params.id);

    const db = conectarBD();

    const personagem = await db.query(
      "SELECT * FROM characters WHERE id = $1",
      [id]
    );

    if (personagem.rows.length === 0) {
      return res.status(404).json({ mensagem: "Personagem não encontrado" });
    }

    const p = personagem.rows[0];

    // Se usuário está logado, verifica se o personagem é dele
    if (req.userId && p.user_id !== req.userId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    const resultado = await db.query(
      "DELETE FROM characters WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({ mensagem: "Personagem excluído com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir personagem:", e);
    res.status(500).json({ erro: "Erro interno ao excluir personagem" });
  }
});


app.listen(port, () => {            // Um socket para "escutar" as requisições
  console.log(`Serviço rodando na porta:  ${port}`);
});