
# 🎲 Ficha Insana

Sistema web para gerenciamento de fichas de personagens, permitindo criar, editar, visualizar e remover registros de forma organizada.

Projeto desenvolvido com foco em prática de desenvolvimento web, organização de API e estruturação de backend.

---

## 🚀 Funcionalidades

✔ Criar nova ficha  
✔ Listar fichas cadastradas  
✔ Atualizar dados da ficha  
✔ Remover ficha  
✔ Organização em rotas e controllers  
✔ Estrutura separada entre backend e frontend (se aplicável)

---

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js
- Express
- JavaScript
- (Banco de dados: adicionar aqui se usar — ex: SQLite / PostgreSQL)

### Frontend (se tiver)
- HTML
- CSS
- JavaScript

---

## 📂 Estrutura do Projeto

```

Ficha-Insana/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── README.md

````

*(Ajuste conforme a estrutura real do seu projeto)*

---

## ⚙️ Como Executar o Projeto

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/SamuelzimMVP/Ficha-Insana.git
````

### 2️⃣ Entrar na pasta do projeto

```bash
cd Ficha-Insana
```

### 3️⃣ Instalar dependências (se houver backend)

```bash
npm install
```

### 4️⃣ Rodar o servidor

```bash
npm start
```

ou

```bash
npm run dev
```

O servidor iniciará em:

```
http://localhost:3000
```

---

## 📡 Exemplos de Endpoints (caso seja API)

### 🔹 Criar ficha

```
POST /fichas
```

Body:

```json
{
  "nome": "Personagem",
  "classe": "Guerreiro",
  "nivel": 5
}
```

---

### 🔹 Listar fichas

```
GET /fichas
```

---

### 🔹 Atualizar ficha

```
PUT /fichas/:id
```

---

### 🔹 Remover ficha

```
DELETE /fichas/:id
```

---

## 🧠 Objetivo do Projeto

Este projeto foi desenvolvido com o objetivo de:

* Praticar criação de APIs REST
* Estruturar backend em camadas
* Trabalhar com organização de código
* Simular um sistema real de gerenciamento

---

## 🔮 Melhorias Futuras

* Implementar autenticação com JWT
* Conectar a banco de dados real
* Criar validação de dados
* Adicionar testes automatizados
* Deploy em plataforma como Render ou Railway

---

## 👨‍💻 Autor

**Samuel Rodrigues**
Desenvolvedor Backend em formação
JavaScript | Node.js | APIs REST

GitHub: [https://github.com/SamuelzimMVP](https://github.com/SamuelzimMVP)
LinkedIn: [https://www.linkedin.com/in/samuel-rodrigues-7b7538360/](https://www.linkedin.com/in/samuel-rodrigues-7b7538360/)

---

```
