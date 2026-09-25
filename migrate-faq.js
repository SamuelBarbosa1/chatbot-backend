import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Iniciando migração de faq.json para o banco de dados MySQL...');

  try {
    // 1. Cria a tabela caso não exista
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faq (
        id INT AUTO_INCREMENT PRIMARY KEY,
        modulo VARCHAR(100) NOT NULL,
        pergunta VARCHAR(255) NOT NULL,
        resposta TEXT NOT NULL,
        destaque BOOLEAN DEFAULT FALSE,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_modulo (modulo),
        INDEX idx_destaque (destaque),
        INDEX idx_ativo (ativo),
        FULLTEXT idx_busca (pergunta, resposta)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✔️ Tabela "faq" verificada/criada.');

    // 2. Lê o arquivo faq.json
    const faqFilePath = path.join(__dirname, 'faq.json');
    if (!fs.existsSync(faqFilePath)) {
      throw new Error(`Arquivo não encontrado: ${faqFilePath}`);
    }

    const rawData = fs.readFileSync(faqFilePath, 'utf-8');
    const faqList = JSON.parse(rawData);

    if (!Array.isArray(faqList) || faqList.length === 0) {
      console.log('ℹ️ Nenhum item encontrado no arquivo faq.json.');
      process.exit(0);
    }

    // 3. Verifica se a tabela já possui dados
    const [existingRows] = await pool.query('SELECT COUNT(*) as count FROM faq');
    const count = existingRows[0].count;

    if (count > 0) {
      console.log(`ℹ️ A tabela "faq" já possui ${count} registros cadastrados.`);
      const forceArg = process.argv.includes('--force');
      if (!forceArg) {
        console.log('👉 Use "node migrate-faq.js --force" se desejar limpar e reimportar tudo.');
        process.exit(0);
      }
      console.log('⚠️ Flag --force detectada: Limpando registros antigos...');
      await pool.query('TRUNCATE TABLE faq');
    }

    // 4. Inserção em lote dos dados
    console.log(`📦 Inserindo ${faqList.length} itens no MySQL...`);
    const values = faqList.map(item => [
      item.modulo || 'Geral',
      item.pergunta || '',
      item.resposta || '',
      item.destaque ? 1 : 0,
      1
    ]);

    await pool.query(
      'INSERT INTO faq (modulo, pergunta, resposta, destaque, ativo) VALUES ?',
      [values]
    );

    console.log(`✅ Sucesso! ${faqList.length} perguntas e respostas foram migradas para o MySQL.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

runMigration();
