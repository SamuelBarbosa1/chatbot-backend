# 📖 Guia de Comandos e Manutenção do Servidor Linux (Chatbots ENSTI)

Este guia contém todos os comandos práticos para gerenciar as aplicações no servidor Linux (`10.61.50.52`).

---

## 🏗️ Estrutura das 3 Aplicações no Projeto

O repositório está organizado para atender aos 3 sistemas de forma independente:

| Sistema | Pasta | Subdomínio | Porta | Banco MySQL | Nome no PM2 |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Club10** | Raiz (`./`) | `https://chatclub.enstihmp.com.br:9443` | **`9443`** (HTTPS) | `chatbot_db` | `chatbot-api` |
| **Associações** | `associacoes/` | `https://chatens.enstihmp.com.br:10443` | **`10443`** (HTTPS) | `chatbot_associacoes` | `chat-associacoes` |
| **AABB** | `aabb/` | `https://chatab.enstihmp.com.br:11443` | **`11443`** (HTTPS) | `chatbot_aabb` | `chat-aabb` |

---

## 🚀 1. Como Conectar ao Servidor via SSH
Abra o **PowerShell** ou **Terminal** no Windows e execute:

```powershell
ssh ensti@10.61.50.52
```
* **Senha:** `ensti@2020`

---

## 🔄 2. Como Subir Alterações do Windows para o Linux (Deploy Rápido)
Sempre que você alterar o `faq.json` ou o `server.js` na sua máquina local:

### Passo A — No PowerShell do seu Windows:
Copie os arquivos atualizados para o servidor:
```powershell
# Enviar o faq.json atualizado
scp "C:\Users\sboliveira\Desktop\chatbot-backend\faq.json" ensti@10.61.50.52:/home/ensti/chatbot-backend/

# Enviar o server.js atualizado
scp "C:\Users\sboliveira\Desktop\chatbot-backend\server.js" ensti@10.61.50.52:/home/ensti/chatbot-backend/
```

### Passo B — No Terminal do Linux (SSH):
Entre na pasta do projeto, atualize o banco MySQL e reinicie a aplicação:
```bash
cd /home/ensti/chatbot-backend

# Se alterou o faq.json, sincroniza o banco de dados
node migrate-faq.js --force

# Reinicia a API para aplicar as mudanças
pm2 restart chatbot-api
```

---

## ⚡ 3. Gerenciando a Aplicação com PM2 (Comandos do Dia a Dia)

No terminal do Linux:

| Ação | Comando |
| :--- | :--- |
| **Ver se a API está online e uso de memória/CPU** | `pm2 status` |
| **Ver os logs/erros da API em tempo real** | `pm2 logs chatbot-api` |
| **Limpar os logs antigos** | `pm2 flush` |
| **Reiniciar a API** | `pm2 restart chatbot-api` |
| **Reiniciar recarregando o arquivo .env** | `pm2 restart chatbot-api --update-env` |
| **Parar a API** | `pm2 stop chatbot-api` |
| **Iniciar a API (se estiver parada)** | `pm2 start chatbot-api` |
| **Salvar o estado atual para religar após reinicialização do servidor** | `pm2 save` |

---

## 🗄️ 4. Gerenciando o Banco de Dados MySQL no Linux

### Entrar no console do MySQL:
```bash
mysql -u chatbot_user -p chatbot_db
```
* **Senha:** `ensti@2020`

### Comandos úteis dentro do MySQL (`mysql>`):
```sql
-- Ver a quantidade de perguntas cadastradas
SELECT COUNT(*) FROM faq;

-- Ver as últimas 10 perguntas cadastradas
SELECT id, modulo, pergunta FROM faq ORDER BY id DESC LIMIT 10;

-- Sair do MySQL
EXIT;
```

### Reiniciar ou verificar o serviço do MySQL no Linux:
```bash
# Ver status do MySQL
sudo systemctl status mysql

# Reiniciar o MySQL
sudo systemctl restart mysql
```

---

## 🌐 5. Informações de Conexão e Rotas da API (HTTPS)

* **IP do Servidor:** `10.61.50.52`
* **Porta HTTPS:** `9443`
* **Certificados SSL:** `fullchain.pem` e `privkey.pem` na raiz do projeto
* **URL de Teste / Frontend interno:**  
  `https://10.61.50.52:9443` (ou via domínio homologado)
* **Rota para o App Mobile (Renato) enviar perguntas:**  
  `POST https://10.61.50.52:9443/api/chat`  
  *Payload JSON:* `{"message": "onde troco de senha?"}`
* **Rota das Dúvidas Frequentes (Destaques):**  
  `GET https://10.61.50.52:9443/api/faq/destaques`

---

## 🔒 6. Como Subir os Certificados e o Servidor HTTPS para o Linux

### No PowerShell do Windows:
Copie o `server.js` atualizado e os dois certificados para o servidor:
```powershell
scp "C:\Users\sboliveira\Desktop\chatbot-backend\server.js" ensti@10.61.50.52:/home/ensti/chatbot-backend/
scp "C:\Users\sboliveira\Desktop\chatbot-backend\fullchain.pem" ensti@10.61.50.52:/home/ensti/chatbot-backend/
scp "C:\Users\sboliveira\Desktop\chatbot-backend\privkey.pem" ensti@10.61.50.52:/home/ensti/chatbot-backend/
```

### No Terminal do Linux (SSH):
Atualize o `.env` para a porta 9443 e reinicie a aplicação:
```bash
cd /home/ensti/chatbot-backend

# Garante que o .env esteja na porta 9443
cat << 'EOF' > .env
PORT=9443
DB_HOST=localhost
DB_PORT=3306
DB_USER=chatbot_user
DB_PASSWORD=ensti@2020
DB_NAME=chatbot_db
EOF

# Reinicia a aplicação carregando os certificados e a porta 9443
pm2 restart chatbot-api --update-env
pm2 save
```