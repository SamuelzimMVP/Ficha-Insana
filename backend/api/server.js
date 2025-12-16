import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();
const port = 3000;
const { Pool } = pkg;

// VARIÁVEL GLOBAL PARA O POOL DE CONEXÕES
let pool = null;

app.use(express.json());

// FUNÇÃO DE CONEXÃO REUTILIZÁVEL (Singleton Pattern)
function conectarBD() {
    if (!pool) {
        // CORREÇÃO: Assegure que process.env.URL_BD está correto e inclui sslmode=require no .env
        if (!process.env.URL_BD) {
            throw new Error("URL_BD não definida. Crie o arquivo .env.");
        }
        pool = new Pool({
            connectionString: process.env.URL_BD,
        });
        
        // Testa a conexão ao criar o pool (BOA PRÁTICA)
        pool.query("SELECT 1")
            .then(() => console.log("Conexão com PostgreSQL (Neon) estabelecida com sucesso."))
            .catch(e => console.error("ERRO CRÍTICO NA CONEXÃO COM O BANCO DE DADOS:", e.message));
    }
    return pool;
}
// ================= ROTAS DE PERSONAGENS =================

// GET /characters → Retorna todos os personagens
app.get("/characters", async (req, res) => {
    console.log("Rota GET /characters solicitada");
    try {
        const db = conectarBD();
        // NOTA: Certifique-se que a tabela 'characters' existe (executando seu SQL no Neon)
        const resultado = await db.query("SELECT * FROM characters ORDER BY id ASC");
        res.json(resultado.rows);
    } catch (e) {
        console.error("Erro ao buscar personagens:", e);
        res.status(500).json({ erro: "Erro interno ao buscar personagens", detalhes: e.message });
    }
});

// GET /characters/:id → Retorna um personagem específico
app.get("/characters/:id", async (req, res) => {
    console.log("Rota GET /characters/:id solicitada");
    try {
        const id = req.params.id;
        const db = conectarBD();
        const resultado = await db.query("SELECT * FROM characters WHERE id = $1", [id]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: "Personagem não encontrado" });
        }
        res.json(resultado.rows[0]);
    } catch (e) {
        console.error("Erro ao buscar personagem:", e);
        res.status(500).json({ erro: "Erro interno ao buscar personagem", detalhes: e.message });
    }
});

// POST /characters → Cria um novo personagem
app.post("/characters", async (req, res) => {
    console.log("Rota POST /characters solicitada");
    try {
        const { name, history, description, inventory } = req.body;

        if (!name) {
            return res.status(400).json({
                erro: "Dados inválidos",
                mensagem: "O campo 'name' é obrigatório."
            });
        }

        const db = conectarBD();
        const consulta = `
            INSERT INTO characters (name, history, description, inventory)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        // Os valores padrão (HP, Sanidade, Mana) serão aplicados automaticamente pelo SQL
        const valores = [name, history, description, inventory];
        const resultado = await db.query(consulta, valores);

        res.status(201).json({
            mensagem: "Personagem criado com sucesso!",
            personagem: resultado.rows[0]
        });
    } catch (e) {
        console.error("Erro ao criar personagem:", e);
        res.status(500).json({
            erro: "Erro interno ao criar personagem",
            detalhes: e.message
        });
    }
});

// PUT /characters/:id → Atualiza um personagem existente (exemplo: atualizar HP)
app.put("/characters/:id", async (req, res) => {
    console.log("Rota PUT /characters/:id solicitada");
    try {
        const id = req.params.id;
        const { name, hp_current, hp_max, sanity_current, sanity_max } = req.body;
        const db = conectarBD();

        const existente = await db.query("SELECT * FROM characters WHERE id = $1", [id]);
        if (existente.rows.length === 0) {
            return res.status(404).json({ mensagem: "Personagem não encontrado" });
        }

        const atual = existente.rows[0];
        
        // Uso de coalescência para manter o valor atual se o novo for nulo/indefinido
        const novoName = name || atual.name;
        const novoHpCurrent = hp_current !== undefined ? hp_current : atual.hp_current;
        const novoHpMax = hp_max !== undefined ? hp_max : atual.hp_max;
        const novoSanityCurrent = sanity_current !== undefined ? sanity_current : atual.sanity_current;
        const novoSanityMax = sanity_max !== undefined ? sanity_max : atual.sanity_max;

        const consulta = `
            UPDATE characters
            SET 
                name = $1, 
                hp_current = $2, 
                hp_max = $3, 
                sanity_current = $4, 
                sanity_max = $5
            WHERE id = $6
            RETURNING *;
        `;
        const resultado = await db.query(consulta, [
            novoName,
            novoHpCurrent,
            novoHpMax,
            novoSanityCurrent,
            novoSanityMax,
            id
        ]);

        res.json({
            mensagem: "Personagem atualizado com sucesso!",
            personagem: resultado.rows[0]
        });
    } catch (e) {
        console.error("Erro ao atualizar personagem:", e);
        res.status(500).json({ erro: "Erro interno ao atualizar personagem", detalhes: e.message });
    }
});

// DELETE /characters/:id → Exclui um personagem
app.delete("/characters/:id", async (req, res) => {
    console.log("Rota DELETE /characters/:id solicitada");
    try {
        const id = req.params.id;
        const db = conectarBD();
        
        // ON DELETE CASCADE do SQL garantirá que Skills e Attacks relacionados sejam apagados.
        const resultado = await db.query("DELETE FROM characters WHERE id = $1 RETURNING *;", [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: "Personagem não encontrado" });
        }

        res.json({ mensagem: "Personagem excluído com sucesso!" });
    } catch (e) {
        console.error("Erro ao excluir personagem:", e);
        res.status(500).json({ erro: "Erro interno ao excluir personagem", detalhes: e.message });
    }
});