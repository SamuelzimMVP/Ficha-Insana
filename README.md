# 🔥 Ficha Insana - Backend API

**Falsa Realidade** - API backend para o sistema de RPG de Mesa brasileiro

## 🎲 Sobre o Projeto

Ficha Insana é o backend do sistema de RPG "Falsa Realidade". Uma API RESTful construída com Node.js e Express para gerenciar personagens, usuários e dados do jogo.

## ✨ Funcionalidades

- **👤 Autenticação JWT** - Login por nome de usuário com tokens seguros
- **📝 CRUD de Personagens** - Criar, ler, atualizar e deletar personagens
- **🔒 Controle de Acesso** - Cada usuário gerencia apenas seus personagens
- **🗡️ Sistema de Ataques** - Dados personalizados com dano garantido
- **📊 Perícias** - 20 perícias configuráveis por personagem

## 🚀 Como Rodar

### Pré-requisitos

- Node.js (v18+)
- PostgreSQL
- Variável de ambiente `URL_BD` configurada

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/SamuelzimMVP/Ficha-Insana.git
cd Ficha-Insana

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env com:
# URL_BD=postgresql://usuario:senha@localhost:5432/seu_banco
# JWT_SECRET=sua_chave_secreta

# Iniciar o servidor
npm start
```

## 📡 Endpoints da API

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/register` | Criar conta (username, password, email opcional) |
| POST | `/login` | Fazer login |
| GET | `/me` | Dados do usuário logado |
| PUT | `/profile` | Atualizar perfil |

### Personagens

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/personagens` | Listar personagens (do usuário logado) |
| GET | `/personagens/:id` | Buscar personagem por ID |
| POST | `/personagens` | Criar novo personagem |
| PUT | `/personagens/:id` | Atualizar personagem |
| DELETE | `/personagens/:id` | Deletar personagem |

## 📁 Estrutura

```
├── server.js       # Servidor Express principal
├── package.json    # Dependências
├── .env            # Variáveis de ambiente
└── versel.json     # Configuração de deploy
```

## 🛠️ Tecnologias

- Node.js + Express
- PostgreSQL (pg)
- JWT (jsonwebtoken)
- Bcrypt (hash de senhas)
- CORS

## 🔗 Frontend

O frontend está disponível em: [Ficha-FS](https://github.com/SamuelzimMVP/Ficha-FS-)

## 📋 Banco de Dados

Execute o script `BD_UPDATE.sql` (disponível no frontend) para criar as tabelas:

```sql
-- Tabela de usuários
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Coluna user_id em characters
ALTER TABLE characters ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE characters ADD CONSTRAINT fk_character_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## 🌐 Deploy

Deploy automático na Vercel via `versel.json`.

---
*Falsa Realidade - Sistema de RPG de Mesa | Menor é Melhor! 🎲*