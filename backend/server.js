// Importações
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Inicialização do app
const app = express();
app.use(express.json());
app.use(cors());
const path = require('path');
// Load environment variables
const port = process.env.PORT || 3000;
// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend'), { maxAge: 0, etag: false }));
// Send the main quiz page on root request
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../quiz.html'))
);

// Configuração do MySQL usando URL ou pool
const poolConfig = process.env.MYSQL_URL || {
  host: process.env.MYSQLHOST || 'localhost',
  port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '1234',
  database: process.env.MYSQLDATABASE || 'simulado_detran',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
const pool = mysql.createPool(poolConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL via pool:', err.message);
  } else {
    console.log('✅ Pool de conexões MySQL pronto');
    connection.release();
  }
});

// Mapeamento das matérias para os nomes no banco de dados
const materiaMap = {
  'direcao-defensiva': 'direcao defensiva',
  'legislacao': 'legislacao',
  'meio-ambiente': 'meio ambiente',
  'mecanica': 'mecanica',
  'primeiros-socorros': 'primeiros socorros'
};

// Rota para buscar questões de uma matéria ou aleatórias
app.get('/prova/:materia', (req, res) => {
  const param = req.params.materia;
  console.log('📥 Matéria recebida via URL:', param);

  const materia = materiaMap[param] || param;
  console.log('🔄 Matéria convertida para banco:', materia);

  const sql = materia === 'aleatorio'
    ? 'SELECT * FROM questoes ORDER BY RAND() LIMIT 10'
    : 'SELECT * FROM questoes WHERE materia = ? ORDER BY RAND() LIMIT 10';

  const queryParams = materia === 'aleatorio' ? [] : [materia];

  pool.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar questões:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    console.log(`✅ ${results.length} questão(ões) retornada(s) com sucesso.`);
    res.json({ success: true, questoes: results });
  });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});