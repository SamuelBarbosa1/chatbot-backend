import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Função para carregar dinamicamente o FAQ do arquivo JSON
function getFaqData() {
  try {
    const rawData = fs.readFileSync('./faq.json', 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Erro ao ler faq.json:', err);
    return [];
  }
}

// 2. Normalizador de texto (remove acentos, pontuações e converte para minúsculas)
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\w\s]/gi, ' ')       // remove pontuações
    .replace(/\s+/g, ' ')            // remove espaços extras
    .trim();
}

// Stopwords em português que não agregam sentido semântico
const STOP_WORDS = new Set([
  'a', 'ao', 'aos', 'as', 'ate', 'com', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles',
  'do', 'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'era', 'eram', 'essa', 'essas',
  'esse', 'esses', 'esta', 'estas', 'este', 'estes', 'eu', 'foi', 'fui', 'ha', 'isso',
  'isto', 'ja', 'me', 'meu', 'meus', 'minha', 'minhas', 'na', 'nao', 'nas', 'nem',
  'no', 'nos', 'nossa', 'nossas', 'nosso', 'nossos', 'num', 'numa', 'o', 'os', 'ou',
  'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'pra', 'qual', 'quais', 'quando',
  'que', 'quem', 'se', 'sem', 'ser', 'seu', 'seus', 'sua', 'suas', 'sao', 'tambem',
  'te', 'tem', 'temos', 'ter', 'teu', 'teus', 'tu', 'tua', 'tuas', 'um', 'uma',
  'umas', 'uns', 'voce', 'voces', 'onde', 'como', 'consigo', 'posso', 'pode', 'podem',
  'algo', 'tudo', 'vai', 'vou', 'estou', 'fazer', 'faco', 'faca'
]);

// Mapa de Sinônimos e Entidades (Assuntos Principais)
const SUBJECT_MAP = {
  'email': ['email', 'e-mail', 'mail', 'correio'],
  'senha': ['senha', 'senhas', 'password', 'pin', 'esqueci', 'recuperar', 'redefinir', 'redefino'],
  'telefone': ['telefone', 'telefones', 'celular', 'celulares', 'fone', 'contato', 'numero'],
  'cpf': ['cpf', 'documento', 'identidade'],
  'dados': ['dados', 'cadastro', 'cadastrais', 'cadastrado', 'cadastrar', 'perfil', 'nome', 'endereco'],
  'notificacao': ['notificacao', 'notificacoes', 'alerta', 'alertas', 'aviso', 'avisos', 'push', 'mensagens'],
  'ingresso': ['ingresso', 'ingressos', 'entrada', 'entradas', 'bilhete', 'bilhetes', 'convite', 'convites', 'ticket', 'tickets', 'carteirinha'],
  'evento': ['show', 'shows', 'evento', 'eventos', 'festa', 'festas', 'localizacao', 'local', 'endereco', 'lugar', 'mapa'],
  'socio': ['socio', 'socios', 'associado', 'associados', 'associacao', 'clube', 'matricula', 'filiado', 'titular'],
  'responsavel': ['responsavel', 'responsaveis', 'menor', 'filho', 'filhos', 'dependente', 'dependentes', 'idade'],
  'amigos': ['amigo', 'amigos', 'familiar', 'familiares', 'parente', 'parentes', 'terceiro', 'terceiros']
};

// Mapa de Ações e Modificadores
const ACTION_MAP = {
  'ver': ['ver', 'vejo', 've', 'vemos', 'olhar', 'olho', 'consultar', 'achar', 'encontrar', 'aparecer', 'acessar', 'abrir'],
  'alterar': ['alterar', 'altero', 'altera', 'mudar', 'mudo', 'trocar', 'troco', 'editar', 'atualizar', 'modificar'],
  'comprar': ['comprar', 'compro', 'compra', 'comprei', 'adquirir', 'pagar', 'pagamento', 'adquiro'],
  'transferir': ['transferir', 'transfiro', 'repassar', 'passar', 'doar', 'ceder'],
  'desativar': ['desativar', 'desativo', 'cancelar', 'desligar', 'silenciar', 'bloquear', 'remover'],
  'chegar': ['chegar', 'chegaram', 'chegou', 'receber', 'recebi', 'recebo', 'envio', 'enviado'],
  'anteriores': ['anterior', 'anteriores', 'passado', 'passados', 'antigo', 'antigos', 'historico']
};

// Extrai assuntos e ações de um texto com casamento exato por palavra
function extractEntities(text) {
  const norm = normalizeText(text);
  const words = norm.split(' ');
  const wordSet = new Set(words);
  const subjects = new Set();
  const actions = new Set();

  for (const [subjectKey, synonyms] of Object.entries(SUBJECT_MAP)) {
    for (const syn of synonyms) {
      if (wordSet.has(syn)) {
        subjects.add(subjectKey);
        break;
      }
    }
  }

  for (const [actionKey, synonyms] of Object.entries(ACTION_MAP)) {
    for (const syn of synonyms) {
      if (wordSet.has(syn)) {
        actions.add(actionKey);
        break;
      }
    }
  }

  const rawKeywords = words.filter(w => w.length > 2 && !STOP_WORDS.has(w));

  return { subjects, actions, rawKeywords, wordSet, norm };
}

// 3. Algoritmo de busca precisa por Relevância Semântica e Filtro de Assunto
function searchFaq(userQuery) {
  const faqList = getFaqData();
  if (faqList.length === 0) {
    return {
      found: false,
      reply: 'A base de conhecimento está sendo atualizada no momento. Por favor, tente novamente em instantes.',
      suggestions: []
    };
  }

  const queryInfo = extractEntities(userQuery);

  let bestMatch = null;
  let highestScore = 0;

  const scoredItems = faqList.map(item => {
    const questionInfo = extractEntities(item.pergunta);
    const answerInfo = extractEntities(item.resposta);
    const moduloInfo = extractEntities(item.modulo || '');

    let score = 0;

    // 1. Correspondência Direta de Frase Inteira
    if (questionInfo.norm === queryInfo.norm) {
      score += 200;
    }

    // 2. Validação de Assuntos (Subjects)
    let matchingSubjectCount = 0;
    for (const sub of queryInfo.subjects) {
      if (questionInfo.subjects.has(sub)) {
        score += 50;
        matchingSubjectCount++;
      } else if (moduloInfo.subjects.has(sub)) {
        score += 25;
        matchingSubjectCount++;
      } else if (answerInfo.subjects.has(sub)) {
        score += 15;
        matchingSubjectCount++;
      }
    }

    // REGRA DE FILTRAGEM:
    // Se a busca tem assuntos específicos (ex: email, notificacao, ingresso, senha),
    // mas este item NÃO tem NADA a ver com esse assunto, descarta com score 0.
    if (queryInfo.subjects.size > 0 && matchingSubjectCount === 0) {
      return { item, score: 0 };
    }

    // Se a busca não tem nenhum assunto reconhecido e nenhuma ação, valida palavras-chave
    if (queryInfo.subjects.size === 0 && queryInfo.actions.size === 0 && queryInfo.rawKeywords.length > 0) {
      let rawMatch = 0;
      for (const token of queryInfo.rawKeywords) {
        if (questionInfo.wordSet.has(token)) rawMatch++;
      }
      if (rawMatch === 0) {
        return { item, score: 0 };
      }
    }

    // 3. Validação de Ações (Actions)
    for (const act of queryInfo.actions) {
      if (questionInfo.actions.has(act)) {
        score += 30;
      } else if (answerInfo.actions.has(act)) {
        score += 10;
      }
    }

    // 4. Penalidade para tópicos adicionais não solicitados na dúvida
    for (const itemSub of questionInfo.subjects) {
      if (!queryInfo.subjects.has(itemSub)) {
        score -= 20;
      }
    }

    // 5. Relevância por Palavras-Chave brutas
    for (const token of queryInfo.rawKeywords) {
      if (questionInfo.wordSet.has(token)) {
        score += 15;
      }
    }

    return { item, score };
  });

  // Ordena por maior pontuação
  scoredItems.sort((a, b) => b.score - a.score);

  // Limiar de confiança mínima (>= 30)
  if (scoredItems.length > 0 && scoredItems[0].score >= 30) {
    bestMatch = scoredItems[0].item;
    highestScore = scoredItems[0].score;
  }

  // Sugestões inteligentes: foca estritamente no mesmo módulo/assunto e limita a 2 para não poluir
  let suggestions = [];
  if (bestMatch) {
    const currentModulo = bestMatch.modulo || '';
    suggestions = faqList
      .filter(i => i.pergunta !== bestMatch.pergunta)
      .filter(i => i.modulo === currentModulo) // apenas do mesmo assunto
      .slice(0, 2)
      .map(i => i.pergunta);
  } else {
    // Se não encontrou, sugere no máximo 2 dúvidas em destaque
    suggestions = faqList
      .filter(i => i.destaque)
      .slice(0, 2)
      .map(i => i.pergunta);
  }

  if (bestMatch) {
    return {
      found: true,
      score: highestScore,
      matchedQuestion: bestMatch.pergunta,
      modulo: bestMatch.modulo,
      reply: bestMatch.resposta,
      suggestions: suggestions
    };
  } else {
    return {
      found: false,
      reply: 'Não encontrei uma resposta exata para a sua dúvida no manual do aplicativo. Veja abaixo algumas opções frequentes que podem te ajudar ou entre em contato com a secretaria.',
      suggestions: suggestions
    };
  }
}

// ==========================================
// 📡 ROTAS DA API REST PARA O APP MOBILE
// ==========================================

// 1. Endpoint principal do Chatbot / Consulta (com delay suave para resposta humanizada)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' });
  }

  // Delay natural de 800ms
  await new Promise(resolve => setTimeout(resolve, 800));

  const result = searchFaq(message);
  return res.json(result);
});

// 2. Endpoint para listar todas as perguntas do FAQ
app.get('/api/faq', (req, res) => {
  const faqData = getFaqData();
  res.json({
    total: faqData.length,
    faq: faqData
  });
});

// 3. Endpoint para buscar diretamente via GET
app.get('/api/faq/search', async (req, res) => {
  const query = req.query.q || '';
  if (!query) {
    return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório.' });
  }

  await new Promise(resolve => setTimeout(resolve, 400));
  const result = searchFaq(query);
  res.json(result);
});

// 4. Endpoint para obter Módulos do FAQ
app.get(['/api/faq/modulos', '/api/faq/categories'], (req, res) => {
  const faqData = getFaqData();
  const modulosMap = {};

  faqData.forEach(item => {
    const mod = item.modulo || 'Geral';
    modulosMap[mod] = (modulosMap[mod] || 0) + 1;
  });

  const modulos = Object.keys(modulosMap).map(mod => ({
    name: mod,
    count: modulosMap[mod]
  }));

  res.json({ modulos });
});

// 5. Endpoint de Perguntas Rápidas (Chips de Sugestão)
app.get('/api/faq/quick-questions', (req, res) => {
  const faqData = getFaqData();
  const featured = faqData.filter(item => item.destaque === true);
  const selected = featured.length > 0 ? featured : faqData.slice(0, 4);
  const quickQuestions = selected.slice(0, 4).map(item => item.pergunta);
  res.json({ questions: quickQuestions });
});

// ==========================================
// 🖥️ TELA VISUAL DE TESTE NO NAVEGADOR
// ==========================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual do App & Atendimento</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #090d16; color: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 16px; }
    .chat-card { background: #111827; width: 100%; max-width: 440px; height: 660px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #1f2937; }
    
    .header { background: #172033; padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #1f2937; }
    .header .avatar { width: 38px; height: 38px; border-radius: 12px; background: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }
    .header h2 { font-size: 15px; font-weight: 600; color: #f8fafc; }
    .header p { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    .header p::before { content: ''; width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block; }
    
    .messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #0c1220; }
    
    .msg-row { display: flex; flex-direction: column; width: 100%; }
    .msg-row.user { align-items: flex-end; }
    .msg-row.bot { align-items: flex-start; }
    
    .msg { max-width: 86%; padding: 11px 15px; font-size: 13.5px; line-height: 1.5; word-wrap: break-word; }
    .msg.user { background: #2563eb; color: #ffffff; border-radius: 16px 16px 4px 16px; }
    .msg.bot { background: #1e293b; color: #e2e8f0; border-radius: 16px 16px 16px 4px; border: 1px solid #334155; }
    .msg.bot strong { color: #93c5fd; font-weight: 600; }
    
    .msg-suggestions { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; width: 86%; }
    .sub-chip { background: #151f32; border: 1px solid #2d3d5a; color: #93c5fd; padding: 7px 12px; border-radius: 10px; font-size: 12px; cursor: pointer; transition: all 0.15s ease; text-align: left; line-height: 1.3; }
    .sub-chip:hover { background: #2563eb; color: #ffffff; border-color: #2563eb; }

    /* Indicador de Digitando */
    .typing-indicator { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
    .typing-dot { width: 5px; height: 5px; background: #94a3b8; border-radius: 50%; animation: typing 1.4s infinite ease-in-out; }
    .typing-dot:nth-child(1) { animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
      30% { transform: translateY(-3px); opacity: 1; }
    }

    .quick-chips-wrapper { padding: 10px 14px; background: #111827; border-top: 1px solid #1f2937; }
    .quick-chips-title { font-size: 11px; color: #64748b; margin-bottom: 6px; font-weight: 500; }
    .quick-chips { display: flex; gap: 6px; flex-wrap: wrap; max-height: 85px; overflow-y: auto; }
    .chip { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 5px 10px; border-radius: 8px; font-size: 11.5px; cursor: pointer; transition: all 0.15s ease; text-align: left; }
    .chip:hover { background: #2563eb; color: #ffffff; border-color: #2563eb; }

    .input-area { padding: 12px 14px; display: flex; gap: 8px; border-top: 1px solid #1f2937; background: #0c1220; }
    .input-area input { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid #334155; background: #172033; color: #ffffff; font-size: 13.5px; outline: none; }
    .input-area input:focus { border-color: #2563eb; }
    .input-area button { background: #2563eb; color: white; border: none; padding: 0 16px; border-radius: 10px; font-weight: 500; cursor: pointer; transition: background 0.15s; font-size: 13.5px; }
    .input-area button:hover { background: #1d4ed8; }
    .input-area button:disabled { background: #374151; cursor: not-allowed; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="chat-card">
    <div class="header">
      <div class="avatar">FAQ</div>
      <div>
        <h2>Central de Ajuda</h2>
        <p>Online</p>
      </div>
    </div>
    <div class="messages" id="messages">
      <div class="msg-row bot">
        <div class="msg bot">Olá! Como posso te ajudar hoje? Digite sua dúvida ou clique em uma das opções abaixo:</div>
      </div>
    </div>
    
    <div class="quick-chips-wrapper">
      <div class="quick-chips-title">Dúvidas Frequentes</div>
      <div class="quick-chips" id="quickChips"></div>
    </div>

    <form class="input-area" id="chatForm">
      <input type="text" id="userInput" placeholder="Digite sua dúvida..." autocomplete="off" required />
      <button type="submit" id="sendBtn">Enviar</button>
    </form>
  </div>

  <script>
    const messagesDiv = document.getElementById('messages');
    const quickChipsDiv = document.getElementById('quickChips');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Carrega perguntas rápidas da API
    fetch('/api/faq/quick-questions')
      .then(res => res.json())
      .then(data => {
        if (data.questions && data.questions.length > 0) {
          data.questions.forEach(q => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chip';
            btn.textContent = q;
            btn.onclick = () => sendMessage(q);
            quickChipsDiv.appendChild(btn);
          });
        }
      });

    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const text = userInput.value.trim();
      if (text) {
        sendMessage(text);
        userInput.value = '';
      }
    };

    function formatText(text) {
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return escaped
        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\n/g, '<br>');
    }

    function appendMessage(text, sender, suggestions = []) {
      const row = document.createElement('div');
      row.className = 'msg-row ' + sender;

      const bubble = document.createElement('div');
      bubble.className = 'msg ' + sender;
      bubble.innerHTML = formatText(text);
      row.appendChild(bubble);

      // Adiciona sugestões relacionadas do mesmo assunto
      if (suggestions && suggestions.length > 0) {
        const suggContainer = document.createElement('div');
        suggContainer.className = 'msg-suggestions';
        suggestions.forEach(s => {
          const sBtn = document.createElement('button');
          sBtn.type = 'button';
          sBtn.className = 'sub-chip';
          sBtn.textContent = s;
          sBtn.onclick = () => sendMessage(s);
          suggContainer.appendChild(sBtn);
        });
        row.appendChild(suggContainer);
      }

      messagesDiv.appendChild(row);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function showTypingIndicator() {
      const row = document.createElement('div');
      row.className = 'msg-row bot';
      row.id = 'typingRow';

      const bubble = document.createElement('div');
      bubble.className = 'msg bot typing-indicator';
      bubble.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

      row.appendChild(bubble);
      messagesDiv.appendChild(row);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function hideTypingIndicator() {
      const typingRow = document.getElementById('typingRow');
      if (typingRow) {
        typingRow.remove();
      }
    }

    async function sendMessage(text) {
      appendMessage(text, 'user');
      userInput.disabled = true;
      sendBtn.disabled = true;

      showTypingIndicator();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        
        hideTypingIndicator();
        appendMessage(data.reply, 'bot', data.suggestions);
      } catch (err) {
        hideTypingIndicator();
        appendMessage('Erro de conexão ao consultar o servidor.', 'bot');
      } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
      }
    }
  </script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de FAQ/Manual rodando em http://localhost:${PORT}`);
});
