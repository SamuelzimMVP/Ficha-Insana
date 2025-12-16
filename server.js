// server.js
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import 'dotenv/config'; // ou require('dotenv').config(); se usar CommonJS



const app = express();
app.use(cors());
app.use(express.json()); // Para receber JSON do frontend

// Conexão com o banco Neon
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // necessário para Neon
});


// Testando conexão com o banco
pool.connect()
  .then(client => {
    console.log("Conectado ao banco Neon!");
    client.release();
  })
  .catch(err => console.error("Erro ao conectar:", err));

// Rota para salvar personagem
app.post('/character', async (req, res) => {
  const { name, hpCurrent, hpMax, sanityCurrent, sanityMax, manaBlocks, skills, attacks, history, description, inventory } = req.body;

  try {
    // Inserir personagem
    const result = await pool.query(
      `INSERT INTO characters (name, hp_current, hp_max, sanity_current, sanity_max, mana_blocks, history, description, inventory)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [name, hpCurrent, hpMax, sanityCurrent, sanityMax, manaBlocks, history, description, inventory]
    );

    const characterId = result.rows[0].id;

    // Inserir skills
    for (const skillName in skills) {
      await pool.query(
        `INSERT INTO skills (character_id, skill_name, skill_value) VALUES ($1,$2,$3)`,
        [characterId, skillName, skills[skillName]]
      );
    }

    // Inserir ataques
    for (const atk of attacks) {
      const atkResult = await pool.query(
        `INSERT INTO attacks (character_id, name, description, flat_damage) VALUES ($1,$2,$3,$4) RETURNING id`,
        [characterId, atk.name, atk.desc || '', atk.flat || 0]
      );

      const attackId = atkResult.rows[0].id;

      for (const d of atk.dice) {
        await pool.query(
          `INSERT INTO attack_dice (attack_id, qty, sides) VALUES ($1,$2,$3)`,
          [attackId, d.qty, d.sides]
        );
      }
    }

    res.json({ success: true, id: characterId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar personagem' });
  }
});

// Rota para carregar personagem pelo id
app.get('/character/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const charRes = await pool.query(`SELECT * FROM characters WHERE id=$1`, [id]);
    if (!charRes.rows[0]) return res.status(404).json({ error: 'Personagem não encontrado' });

    const character = charRes.rows[0];

    // Carregar skills
    const skillsRes = await pool.query(`SELECT skill_name, skill_value FROM skills WHERE character_id=$1`, [id]);
    const skills = {};
    skillsRes.rows.forEach(s => skills[s.skill_name] = s.skill_value);

    // Carregar ataques
    const attacksRes = await pool.query(`SELECT * FROM attacks WHERE character_id=$1`, [id]);
    const attacks = [];

    for (const atk of attacksRes.rows) {
      const diceRes = await pool.query(`SELECT qty, sides FROM attack_dice WHERE attack_id=$1`, [atk.id]);
      attacks.push({
        name: atk.name,
        desc: atk.description,
        flat: atk.flat_damage,
        dice: diceRes.rows
      });
    }

    res.json({ ...character, skills, attacks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar personagem' });
  }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
