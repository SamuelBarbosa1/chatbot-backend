import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fallback para faq.json caso o MySQL não esteja disponível ou a tabela esteja vazia
 */
function getFaqFromFile() {
  try {
    const rawData = fs.readFileSync(path.join(__dirname, 'faq.json'), 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Erro ao ler faq.json fallback:', err.message);
    return [];
  }
}

/**
 * Obtém todos os itens ativos do FAQ (prioriza MySQL)
 */
export async function getFaqData() {
  try {
    const [rows] = await pool.query(
      'SELECT id, modulo, pergunta, resposta, destaque, ativo FROM faq WHERE ativo = 1 ORDER BY id ASC'
    );
    if (rows && rows.length > 0) {
      return rows.map(r => ({
        ...r,
        destaque: Boolean(r.destaque),
        ativo: Boolean(r.ativo)
      }));
    }
    return getFaqFromFile();
  } catch (err) {
    return getFaqFromFile();
  }
}

/**
 * Obtém apenas as perguntas em destaque
 */
export async function getDestaques() {
  try {
    const [rows] = await pool.query(
      'SELECT id, modulo, pergunta, resposta, destaque FROM faq WHERE destaque = 1 AND ativo = 1 ORDER BY id ASC'
    );
    if (rows && rows.length > 0) {
      return rows.map(r => ({
        ...r,
        destaque: true
      }));
    }
  } catch (err) {
    // segue para fallback
  }

  const fileData = getFaqFromFile();
  return fileData.filter(item => item.destaque);
}

/**
 * Obtém módulos e contagem de perguntas
 */
export async function getModulos() {
  try {
    const [rows] = await pool.query(`
      SELECT modulo as name, COUNT(*) as count 
      FROM faq 
      WHERE ativo = 1 
      GROUP BY modulo 
      ORDER BY count DESC
    `);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    // segue para fallback
  }

  const list = getFaqFromFile();
  const modulosMap = {};
  list.forEach(item => {
    const mod = item.modulo || 'Geral';
    modulosMap[mod] = (modulosMap[mod] || 0) + 1;
  });

  return Object.keys(modulosMap).map(mod => ({
    name: mod,
    count: modulosMap[mod]
  }));
}

/**
 * Cria uma nova pergunta/resposta no MySQL
 */
export async function createFaqItem({ modulo, pergunta, resposta, destaque = false }) {
  const [result] = await pool.query(
    'INSERT INTO faq (modulo, pergunta, resposta, destaque, ativo) VALUES (?, ?, ?, ?, 1)',
    [modulo, pergunta, resposta, destaque ? 1 : 0]
  );
  return {
    id: result.insertId,
    modulo,
    pergunta,
    resposta,
    destaque: Boolean(destaque),
    ativo: true
  };
}

/**
 * Atualiza um item do FAQ no MySQL
 */
export async function updateFaqItem(id, { modulo, pergunta, resposta, destaque, ativo }) {
  const fields = [];
  const values = [];

  if (modulo !== undefined) { fields.push('modulo = ?'); values.push(modulo); }
  if (pergunta !== undefined) { fields.push('pergunta = ?'); values.push(pergunta); }
  if (resposta !== undefined) { fields.push('resposta = ?'); values.push(resposta); }
  if (destaque !== undefined) { fields.push('destaque = ?'); values.push(destaque ? 1 : 0); }
  if (ativo !== undefined) { fields.push('ativo = ?'); values.push(ativo ? 1 : 0); }

  if (fields.length === 0) return null;

  values.push(id);
  await pool.query(`UPDATE faq SET ${fields.join(', ')} WHERE id = ?`, values);
  return true;
}

/**
 * Desativa ou remove um item do FAQ
 */
export async function deleteFaqItem(id, hardDelete = false) {
  if (hardDelete) {
    await pool.query('DELETE FROM faq WHERE id = ?', [id]);
  } else {
    await pool.query('UPDATE faq SET ativo = 0 WHERE id = ?', [id]);
  }
  return true;
}
