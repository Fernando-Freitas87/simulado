// Importações
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Inicialização do app
const app = express();
app.use(express.json());
app.use(cors());

// Configuração do MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'simulado_detran'
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
app.listen(3000, () => {
  console.log('🚀 Servidor rodando em http://localhost:3000');
});