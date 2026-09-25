# 📖 Manual & FAQ Backend - Node.js (API para App Mobile)

Servidor de consulta inteligente do **Manual do Aplicativo e FAQ**, desenvolvido em **Node.js** com **Express** e ES Modules.

Este backend atua como a base de conhecimento do aplicativo mobile, respondendo dúvidas dos usuários com busca semântica/palavras-chave em tempo real, fornecendo respostas estruturadas por **Módulos** e sugestões de perguntas relacionadas (`chips`).

---

## 📁 Estrutura do Projeto

```
chatbot-backend/
├── .env                     # Porta da aplicação (PORT=3000)
├── faq.json                 # Base de dados com todas as perguntas, respostas e módulos
├── package.json             # Configuração e dependências do Node.js
├── server.js                # Servidor Express, algoritmo de busca no FAQ e UI de testes
└── README.md                # Documentação técnica para os desenvolvedores mobile
```

---

## 🚀 Como Rodar o Servidor

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Iniciar em modo de desenvolvimento (com auto-reload):**
   ```bash
   npm run dev
   ```

3. **Iniciar em modo produção:**
   ```bash
   npm start
   ```

O servidor estará rodando em: 👉 **http://localhost:3000**

---

## 📡 Guia da API para o Desenvolvedor Mobile (React Native / Flutter / Android / iOS)

### 1. 💬 Enviar Pergunta do Usuário (Chatbot / Consulta)
Envia a dúvida digitada pelo usuário e retorna a resposta encontrada com sugestões inteligentes de continuidade.

- **Método:** `POST`
- **URL:** `http://localhost:3000/api/chat`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "message": "como alterar o telefone cadastrado"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "found": true,
    "score": 30,
    "matchedQuestion": "Como alterar o telefone do cadastro?",
    "modulo": "Conta e Acesso",
    "reply": "Vá até o Perfil no canto superior direito do aplicativo e clique em \"Meus Dados\".",
    "suggestions": [
      "Como redefinir minha senha?",
      "Como alterar meus dados cadastrais?",
      "Não consigo alterar o meu cpf?"
    ]
  }
  ```
  *(Se nenhuma resposta for encontrada, `found` será `false`, retornando uma mensagem amigável e as dúvidas mais frequentes em `suggestions`).*

---

### 2. ⚡ Obter Dúvidas Frequentes (Chips Iniciais)
Ideal para renderizar os botões de perguntas rápidas quando o usuário abre a tela do assistente no app.

- **Método:** `GET`
- **URL:** `http://localhost:3000/api/faq/quick-questions`
- **Response (200 OK):**
  ```json
  {
    "questions": [
      "Como redefinir minha senha?",
      "Como alterar meus dados cadastrais?",
      "Como alterar o telefone do cadastro?",
      "Como eu vejo as notificações?"
    ]
  }
  ```

---

### 3. 📚 Listar Todas as Perguntas (Tela do Manual / Central de Ajuda)
Retorna todas as perguntas e respostas cadastradas para compor uma lista ou sanfona (accordion) de ajuda.

- **Método:** `GET`
- **URL:** `http://localhost:3000/api/faq`
- **Response (200 OK):**
  ```json
  {
    "total": 13,
    "faq": [
      {
        "modulo": "Conta e Acesso",
        "pergunta": "Como redefinir minha senha?",
        "resposta": "Acesse a tela de Login. Coloque o seu E-mail...",
        "destaque": true
      }
    ]
  }
  ```

---

### 4. 🏷️ Obter Módulos do FAQ
Retorna os módulos e a quantidade de perguntas cadastradas em cada um (ex: "Conta e Acesso", "Ingressos", "Notificações", "Sócios e Associação").

- **Método:** `GET`
- **URL:** `http://localhost:3000/api/faq/modulos`
- **Response (200 OK):**
  ```json
  {
    "modulos": [
      { "name": "Conta e Acesso", "count": 5 },
      { "name": "Notificações", "count": 2 },
      { "name": "Ingressos", "count": 2 },
      { "name": "Sócios e Associação", "count": 4 }
    ]
  }
  ```

---

### 5. 🔍 Busca Direta por Termo (Query Param)
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/faq/search?q=notificacoes`

---

## ✏️ Como Adicionar ou Modificar Perguntas no FAQ

Para cadastrar novas dúvidas ou ajustar respostas do manual, basta editar o arquivo [`faq.json`](file:///c:/Users/sboliveira/Desktop/chatbot-backend/faq.json):

```json
{
  "modulo": "Nome do Módulo",
  "pergunta": "Pergunta que o usuário faz?",
  "resposta": "Explicação passo a passo do aplicativo.",
  "destaque": true
}
```
> **Nota:** As alterações no `faq.json` passam a valer imediatamente na próxima consulta, sem necessidade de reiniciar o servidor!

---

## 🖥️ Tela Visual de Testes

Você pode testar a interface e a lógica a qualquer momento abrindo no seu navegador:
👉 **`http://localhost:3000`**
