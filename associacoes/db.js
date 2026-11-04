import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = (process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1').trim();
const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306;
const user = (process.env.DB_USER || process.env.MYSQL_USER || 'root').trim();
const password = process.env.DB_PASSWORD !== undefined 
  ? process.env.DB_PASSWORD 
  : (process.env.MYSQL_PASSWORD || '');
const database = (process.env.DB_NAME || process.env.MYSQL_DATABASE || 'chatbot_db').trim();

export const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Conexão com o banco MySQL (${database}) estabelecida com sucesso!`);
    connection.release();
    return true;
  } catch (error) {
    console.warn('⚠️ Atenção: Não foi possível conectar ao MySQL:', error.message);
    console.warn('ℹ️ Verifique as credenciais no arquivo .env e se o serviço MySQL está em execução.');
    return false;
  }
}
