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
app.use(express.static(path.join(__dirname, '../frontend')));
// Send the main quiz page on root request
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/quiz.html'))
);

// Configuração do MySQL
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '1234',
  database: process.env.MYSQL_DATABASE || 'simulado_detran'
});

db.connect(err => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
  } else {
    console.log('✅ Conectado ao MySQL');
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

  db.query(sql, queryParams, (err, results) => {
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