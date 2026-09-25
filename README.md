# 📖 Chatbot & FAQ Backend - Node.js + MySQL (Google Cloud)

Serviço de autoatendimento e FAQ inteligente para o aplicativo mobile e web, desenvolvido em **Node.js + Express** e persistência de dados em **MySQL**.

A arquitetura foi desenhada para operar de forma desacoplada da API principal do clube (Java 8), hospedada no **Google Cloud Platform (GCP)** sob o subdomínio dedicado:
👉 **`https://chat.enstihmp.com.br`**

---

## 🏛️ Visão Geral da Arquitetura

```
                         enstihmp.com.br
                                |
         +----------------------+----------------------+
         |                                             |
   API PRINCIPAL (Legado)                       CHATBOT & FAQ (Novo)
         |                                             |
https://enstihmp.com.br/clubcom/ws             https://chat.enstihmp.com.br
         |                                             |
       Java 8                               Google Cloud (Cloud Run / VM)
  • /login                                  Node.js (Express)
  • /eventos                                           |
  • /ingressos                                  MySQL Database
                                            (Tabela: faq - modulo,
                                             pergunta, resposta, destaque)
```

---

## 📁 Estrutura do Projeto

```
chatbot-backend/
├── .env                  # Configuração de portas e credenciais do MySQL
├── .env.example          # Modelo de variáveis de ambiente
├── db.js                 # Pool de conexão com o banco MySQL (mysql2/promise)
├── faqService.js         # Camada de regras, consultas MySQL e fallback
├── schema.sql            # Script DDL para criar a tabela `faq` no MySQL
├── migrate-faq.js        # Script de migração automática do faq.json para o MySQL
├── faq.json              # Base legada / backup inicial dos dados
├── package.json          # Dependências e scripts do projeto
├── server.js             # API REST, motor de scoring inteligente e UI de testes
└── README.md             # Esta documentação
```

---

## 🗄️ Estrutura da Tabela no MySQL (`faq`)

O banco de dados utiliza a tabela `faq` com os seguintes campos:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | Identificador único (Chave Primária) |
| `modulo` | `VARCHAR(100)` | Assunto/Categoria (ex: Perfil e Acesso, Ingressos) |
| `pergunta` | `VARCHAR(255)` | Pergunta ou dúvida do associado |
| `resposta` | `TEXT` | Instruções passo a passo da resposta |
| `destaque` | `BOOLEAN` | `1` para chips em destaque na tela inicial, `0` normal |
| `ativo` | `BOOLEAN` | `1` ativo para exibição, `0` oculto/desativado |
| `created_at` | `TIMESTAMP` | Data de criação |
| `updated_at` | `TIMESTAMP` | Data da última alteração |

---

## 🚀 Como Configurar e Rodar

### 1. Pré-requisitos
- Node.js instalado (v18 ou superior)
- MySQL Server ativo (local ou no Google Cloud SQL)

### 2. Configurar o `.env`
Crie ou ajuste seu arquivo `.env` com os dados do banco:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=chatbot_db
```

### 3. Criar o Banco e Migrar os Dados
Execute a migração para criar a tabela e importar automaticamente todas as perguntas do `faq.json` para o MySQL:
```bash
npm run migrate
```
*(Caso queira limpar e recarregar os dados, use `node migrate-faq.js --force`)*.

### 4. Iniciar o Servidor
```bash
# Modo de desenvolvimento com auto-reload:
npm run dev

# Ou modo produção:
npm start
```
Acesse a interface de testes no navegador: 👉 **http://localhost:3000**

---

## 📡 Endpoints da API (`https://chat.enstihmp.com.br`)

### 1. 💬 Consulta ao Chatbot
Retorna a resposta mais assertiva e sugestões inteligentes com base na pergunta digitada:
- **Método:** `POST`
- **Rota:** `/api/chat`
- **Body:**
  ```json
  {
    "message": "como alterar meu telefone cadastrado"
  }
  ```
- **Resposta (200 OK):**
  ```json
  {
    "found": true,
    "score": 90,
    "matchedQuestion": "Como alterar o telefone do cadastro?",
    "modulo": "Perfil e Acesso",
    "reply": "Vá até o Perfil no canto superior direito do aplicativo e clique em \"Meus Dados\".",
    "suggestions": [
      "Como alterar meus dados cadastrais?",
      "Como alterar ou ver o meu e-mail cadastrado?"
    ]
  }
  ```

---

### 2. ⭐ Dúvidas em Destaque
Retorna exclusivamente as perguntas marcadas com `destaque = true` (utilizado para os botões/chips iniciais de acesso rápido):
- **Método:** `GET`
- **Rota:** `/api/faq/destaques`
- **Resposta (200 OK):**
  ```json
  {
    "total": 5,
    "destaques": [
      {
        "id": 1,
        "modulo": "Perfil e Acesso",
        "pergunta": "Como redefinir minha senha?",
        "resposta": "Acesse a tela de Login, informe seu e-mail...",
        "destaque": true
      }
    ]
  }
  ```

---

### 3. 📚 Listar Todas as Perguntas
Retorna todas as dúvidas ativas do banco, podendo filtrar por módulo via query string:
- **Método:** `GET`
- **Rota:** `/api/faq` ou `/api/faq?modulo=Ingressos`

---

### 4. 🏷️ Listar Módulos / Categorias
Retorna todos os módulos cadastrados e a quantidade de perguntas em cada um:
- **Método:** `GET`
- **Rota:** `/api/faq/modulos`

---

### 5. 🛠️ Endpoints Administrativos (Gestão do FAQ no MySQL)
- `POST /api/admin/faq`: Cadastrar nova dúvida (`{ modulo, pergunta, resposta, destaque }`)
- `PUT /api/admin/faq/:id`: Atualizar dados ou alternar destaque de uma dúvida existente
- `DELETE /api/admin/faq/:id`: Desativar dúvida (`?hard=true` para exclusão definitiva)
- `GET /health`: Health-check para o monitor do Google Cloud

---

## ☁️ Hospedagem no Google Cloud Platform (GCP)

Quando a conta do Google Cloud estiver ativa:

1. **Banco de Dados (Cloud SQL)**:
   - Crie uma instância de **Cloud SQL for MySQL** (ex: `db-f1-micro` ou `db-custom`).
   - Crie a base de dados `chatbot_db` e o usuário da aplicação.
   - Execute o script [schema.sql](file:///c:/Users/sboliveira/Desktop/chatbot-backend/schema.sql).

2. **Backend (Google Cloud Run)**:
   - Crie o container da aplicação e faça o deploy no **Cloud Run**.
   - Conecte o Cloud Run à instância do Cloud SQL através do conector nativo do Cloud SQL.
   - Configure as variáveis de ambiente (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

3. **Subdomínio (`chat.enstihmp.com.br`)**:
   - No Cloud Run, acesse **Mapeamentos de Domínio Personalizado** (Custom Domains).
   - Adicione `chat.enstihmp.com.br`.
   - Adicione o registro `CNAME` gerado na zona de DNS do domínio `enstihmp.com.br`.
   - O Google Cloud provisiona o certificado SSL (HTTPS) automaticamente.
