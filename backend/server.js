const express = require('express');
const cors = require('cors');
const pool = require('../db'); // Ajuste o caminho se necessário (../db.js)

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para salvar personagem
app.post('/character', async (req, res) => {
  const { name, hpCurrent, hpMax, sanityCurrent, sanityMax, manaBlocks, history, description, inventory, skills, attacks } = req.body;

  try {
    // Insere personagem
    const charResult = await pool.query(
      'INSERT INTO characters (name, hp_current, hp_max, sanity_current, sanity_max, mana_blocks, history, description, inventory) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [name, hpCurrent, hpMax, sanityCurrent, sanityMax, manaBlocks, history, description, inventory]
    );
    const characterId = charResult.rows[0].id;

    // Insere skills (se fornecidas)
    if (skills) {
      for (const [skillName, skillValue] of Object.entries(skills)) {
        await pool.query('INSERT INTO skills (character_id, skill_name, skill_value) VALUES ($1, $2, $3)', [characterId, skillName, skillValue]);
      }
    }

    // Insere attacks (se fornecidas)
    if (attacks) {
      for (const attack of attacks) {
        const attackResult = await pool.query('INSERT INTO attacks (character_id, name, description, flat_damage) VALUES ($1, $2, $3, $4) RETURNING id', [characterId, attack.name, attack.description, attack.flat]);
        const attackId = attackResult.rows[0].id;

        // Insere dados dos ataques
        for (const dice of attack.dice) {
          await pool.query('INSERT INTO attack_dice (attack_id, qty, sides) VALUES ($1, $2, $3)', [attackId, dice.qty, dice.sides]);
        }
      }
    }

    res.json({ id: characterId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar personagem' });
  }
});

// Endpoint para carregar personagem
app.get('/character/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Carrega personagem
    const charResult = await pool.query('SELECT * FROM characters WHERE id = $1', [id]);
    if (charResult.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado' });

    const character = charResult.rows[0];

    // Carrega skills
    const skillsResult = await pool.query('SELECT skill_name, skill_value FROM skills WHERE character_id = $1', [id]);
    character.skills = {};
    skillsResult.rows.forEach(row => {
      character.skills[row.skill_name] = row.skill_value;
    });

    // Carrega attacks
    const attacksResult = await pool.query('SELECT id, name, description, flat_damage FROM attacks WHERE character_id = $1', [id]);
    character.attacks = [];
    for (const attack of attacksResult.rows) {
      const diceResult = await pool.query('SELECT qty, sides FROM attack_dice WHERE attack_id = $1', [attack.id]);
      attack.dice = diceResult.rows;
      character.attacks.push(attack);
    }

    res.json(character);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar personagem' });
  }
});

// Exporta o app para Vercel (serverless)
module.exports = app;
