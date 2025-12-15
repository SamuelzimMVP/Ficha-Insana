import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // para Heroku/PostgreSQL com SSL
});

// ==========================
// CRIAR TABELA CASO NÃO EXISTA
// ==========================
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS characters (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                skills JSONB NOT NULL,
                attacks JSONB NOT NULL,
                history TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tabela 'characters' pronta!");
    } catch (err) {
        console.error("Erro ao criar tabela:", err);
    }
}

// Inicializa o banco
initDB();

// ==========================
// ROTAS
// ==========================

// Criar ou atualizar personagem
app.post("/character", async (req, res) => {
    const { id, name, skills, attacks, history } = req.body;

    try {
        if (id) {
            // UPDATE
            await pool.query(
                `UPDATE characters 
                 SET name=$1, skills=$2, attacks=$3, history=$4 
                 WHERE id=$5`,
                [name, skills, attacks, history, id]
            );
            res.json({ success: true, id });
        } else {
            // INSERT
            const result = await pool.query(
                `INSERT INTO characters (name, skills, attacks, history) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [name, skills, attacks, history]
            );
            res.json({ success: true, id: result.rows[0].id });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao salvar personagem" });
    }
});

// Listar todos os personagens
app.get("/characters", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name FROM characters ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar personagens" });
    }
});

// Buscar personagem específico
app.get("/character/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM characters WHERE id=$1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Personagem não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao carregar personagem" });
    }
});

// ==========================
// INICIAR SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor RPG funcionando na porta ${PORT}`);
});
