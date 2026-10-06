const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'faq.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const newQuestions = [
  {
    "modulo": "Pagamentos e Taxas",
    "pergunta": "Em quantas vezes posso parcelar o meu ingresso?",
    "resposta": "O parcelamento no cartão de crédito pode ser feito em até 7 vezes, dependendo das configurações definidas pelos organizadores de cada evento.",
    "destaque": true
  },
  {
    "modulo": "Pagamentos e Taxas",
    "pergunta": "Todos os shows aceitam parcelamento em 7 meses?",
    "resposta": "Não necessariamente. A quantidade máxima de parcelas varia de acordo com cada show cadastrado no sistema. As opções exatas aparecerão para você na tela de pagamento.",
    "destaque": false
  },
  {
    "modulo": "Cancelamento e Reembolso",
    "pergunta": "Até quando posso pedir o cancelamento da minha compra?",
    "resposta": "O prazo de cancelamento padrão é de até 7 dias, mas isso pode variar de acordo com as regras do evento (ex: até a data anterior ao evento). Consulte os detalhes na tela do seu ingresso.",
    "destaque": true
  },
  {
    "modulo": "Cancelamento e Reembolso",
    "pergunta": "A regra de 7 dias para cancelamento vale para qualquer evento?",
    "resposta": "O prazo de até 7 dias é configurado pelos organizadores, mas cada evento pode ter sua própria data limite para cancelamento (como por exemplo, cancelar apenas até a data anterior ao show). Verifique sempre as regras do evento que você comprou.",
    "destaque": false
  }
];

data.push(...newQuestions);
fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Novas perguntas sobre parcelamento e cancelamento adicionadas.');
