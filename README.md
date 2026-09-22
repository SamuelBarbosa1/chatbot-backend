# ☕ Chatbot Backend - Java 8 & Apache Tomcat 9

Backend do Assistente Virtual integrado à **API oficial do Google Gemini**, desenvolvido para **Java 8 (1.8)** e empacotado como aplicação Web padrão (**WAR**) para implantação no **Apache Tomcat 9**.

---

## 📁 Estrutura do Projeto

```
chatbot-backend/
├── pom.xml                               # Configuração Maven (Java 1.8 + WAR)
└── src/
    └── main/
        ├── java/
        │   └── com/chatbot/
        │       ├── model/
        │       │   └── FaqItem.java            # Modelo de dados do FAQ
        │       ├── service/
        │       │   └── GeminiService.java      # Integração HTTP REST com o Google Gemini
        │       ├── servlet/
        │       │   ├── ChatServlet.java        # Endpoint POST /api/chat
        │       │   └── QuickQuestionsServlet.java # Endpoint GET /api/faq/quick-questions
        │       ├── filter/
        │       │   └── CorsFilter.java         # Filtro CORS para permitir React Native / Web
        │       ├── util/
        │       │   ├── ConfigLoader.java       # Carregador de configurações e variáveis de ambiente
        │       │   └── FaqLoader.java          # Carregador dinâmico do faq.json
        │       └── DevServer.java              # Servidor local para testes rápidos
        ├── resources/
        │   ├── faq.json                        # Base de conhecimento de perguntas e respostas
        │   └── application.properties          # Chave da API e configurações do Gemini
        └── webapp/
            ├── index.html                      # Interface visual interativa para testes no navegador
            └── WEB-INF/
                └── web.xml                     # Mapeamento de Servlets para o Tomcat 9
```

---

## 🚀 Como Gerar o Pacote `.war` (Maven)

No terminal da pasta do projeto, execute:

```bash
mvn clean package
```

Isso compilará o código em **Java 8** e gerará o arquivo:
👉 `target/chatbot.war`

---

## 🚢 Como Fazer o Deploy no Apache Tomcat 9

1. Baixe ou abra a pasta de instalação do seu **Apache Tomcat 9**.
2. Copie o arquivo `target/chatbot.war` para a pasta:
   ```
   apache-tomcat-9.x.x/webapps/
   ```
3. Inicie o Tomcat:
   - **No Windows:** execute `bin/startup.bat`
   - **No Linux/Mac:** execute `bin/startup.sh`
4. O Tomcat fará o deploy automático da aplicação na rota `/chatbot`.

---

## 📡 Endpoints da API

Quando o Tomcat estiver rodando:

### 1. 💬 Enviar Mensagem no Chat
- **URL:** `POST http://localhost:8080/chatbot/api/chat`
- **Header:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "message": "Como emitir a segunda via do boleto?"
  }
  ```
- **Resposta:**
  ```json
  {
    "reply": "Olá! Para emitir a segunda via do boleto, navegue até a aba **Financeiro** > **Meus Boletos**..."
  }
  ```

### 2. 📋 Obter Perguntas Rápidas (Chips)
- **URL:** `GET http://localhost:8080/chatbot/api/faq/quick-questions`
- **Resposta:**
  ```json
  {
    "questions": [
      "Como redefinir minha senha?",
      "Como alterar meus dados cadastrais?",
      "Como emitir a segunda via do boleto?",
      "Qual o horário de atendimento do suporte humano?"
    ]
  }
  ```

### 3. 🖥️ Tela Visual de Teste no Navegador
- **URL:** `http://localhost:8080/chatbot/`

---

## ⚙️ Configuração da Chave da Empresa

Você pode configurar a chave da API do Gemini de duas formas:

1. **No arquivo [application.properties](src/main/resources/application.properties):**
   ```properties
   gemini.api.key=SUA_CHAVE_AQUI
   ```

2. **Ou por Variável de Ambiente no Servidor:**
   ```bash
   GEMINI_API_KEY=SUA_CHAVE_AQUI
   ```
   *(A variável de ambiente tem prioridade sobre o application.properties, ideal para servidores de produção)*.
