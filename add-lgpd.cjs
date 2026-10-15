const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'faq.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const lgpdQuestions = [
  {
    "modulo": "Perfil e Meus Dados",
    "pergunta": "Como o aplicativo trata meus dados pessoais e a LGPD?",
    "resposta": "O aplicativo cumpre rigorosamente a Lei Geral de Proteção de Dados (LGPD). Seus dados são utilizados apenas para a emissão de ingressos e segurança do acesso aos eventos. A qualquer momento você pode consultar a Política de Privacidade na aba Perfil ou solicitar a exclusão de sua conta.",
    "destaque": true
  },
  {
    "modulo": "Perfil e Meus Dados",
    "pergunta": "Como exercer meus direitos de privacidade e proteção de dados no app?",
    "resposta": "Na aba Perfil você pode consultar a nossa Política de Privacidade e em Meus Dados você pode alterar informações cadastrais ou solicitar a exclusão definitiva do seu cadastro conforme a LGPD.",
    "destaque": false
  }
];

data.push(...lgpdQuestions);
fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Perguntas sobre LGPD adicionadas com sucesso.');
