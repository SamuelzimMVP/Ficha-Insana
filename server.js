import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();         // Carrega e processa o arquivo .env
import express from "express";      // Requisição do pacote do express
const app = express();              // Instancia o Express
const port = 3000;                  // Define a porta
const { Pool } = pkg; // Obtém o construtor Pool do pacote pg para gerenciar conexões com o banco de dados PostgreSQL
let pool = null; // Variável para armazenar o pool de conexões com o banco de dados

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://ficha-fs.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
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
app.get("/personagens", async (req, res) => {
  console.log("Rota GET /personagens solicitada");
  try {
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM characters ORDER BY created_at DESC");
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar personagens:", e);
    res.status(500).json({ erro: "Erro interno ao buscar personagens" });
  }
});
app.get("/personagens/:id", async (req, res) => {
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
      ...personagem.rows[0],
      skills: skills.rows,
      attacks: attacks.rows
    });
  } catch (e) {
    console.error("Erro ao buscar personagem:", e);
    res.status(500).json({ erro: "Erro interno ao buscar personagem" });
  }
});
app.post("/personagens", async (req, res) => {
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

    const personagem = await db.query(`
      INSERT INTO characters
      (name, hp_current, hp_max, sanity_current, sanity_max, mana_blocks)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [
      name,
      hpCurrent ?? 100,
      hpMax ?? 100,
      sanityCurrent ?? 100,
      sanityMax ?? 100,
      manaBlocks ?? 0
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

    res.status(201).json({ mensagem: "Personagem criado com sucesso!" });
  } catch (e) {
    console.error("Erro ao criar personagem:", e);
    res.status(500).json({ erro: "Erro interno ao criar personagem" });
  }
});
app.put("/personagens/:id", async (req, res) => {
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
app.delete("/personagens/:id", async (req, res) => {
  console.log("Rota DELETE /personagens/:id solicitada");
  try {
    const id = Number(req.params.id);

    const db = conectarBD();

    const resultado = await db.query(
      "DELETE FROM characters WHERE id = $1 RETURNING *",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Personagem não encontrado" });
    }

    res.json({ mensagem: "Personagem excluído com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir personagem:", e);
    res.status(500).json({ erro: "Erro interno ao excluir personagem" });
  }
});


app.listen(port, () => {            // Um socket para "escutar" as requisições
  console.log(`Serviço rodando na porta:  ${port}`);
});