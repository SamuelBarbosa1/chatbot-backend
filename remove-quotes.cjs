const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'faq.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.forEach(item => {
    if (item.pergunta) {
        item.pergunta = item.pergunta.replace(/['"]/g, '');
    }
    if (item.resposta) {
        item.resposta = item.resposta.replace(/['"]/g, '');
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Quotes removed from faq.json successfully.');
