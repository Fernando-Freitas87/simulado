(function () {
  const passThreshold = 70;
  let questions = [];
  let current = 0;
  const answers = {};

  // Valida CPF (padrão brasileiro)
  function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    return resto === parseInt(cpf.charAt(10));
  }

  async function loadQuestions(materia) {
    const response = await fetch(`http://localhost:3000/prova/${materia}`);
    const data = await response.json();
    if (data.success) {
      questions = data.questoes.map(q => ({
        text: q.pergunta,
        options: [
          { value: 'a', label: q.opcao_a },
          { value: 'b', label: q.opcao_b },
          { value: 'c', label: q.opcao_c },
          { value: 'd', label: q.opcao_d },
          { value: 'e', label: q.opcao_e }
        ],
        answer: q.resposta_correta
      }));
      current = 0;
      renderQuestion();
      document.getElementById('quiz-container').style.display = 'block';
      document.getElementById('submit-button').style.display = 'inline-block';
      document.querySelector('.materia-selector').style.display = 'none';
    } else {
      alert('Erro ao carregar prova: ' + data.error);
    }
  }

  function init() {
    document.getElementById('submit-button').addEventListener('click', handleSubmit);
    document.getElementById('restart-button').addEventListener('click', handleRestart);
    document.getElementById('start-button').addEventListener('click', () => {
      const cpf = document.getElementById('cpf-usuario').value;
      if (!validarCPF(cpf)) {
        alert('Usuário não cadastrado. Procure sua Autoescola.');
        return;
      }
      const materia = document.getElementById('materia-select').value;
      loadQuestions(materia);
    });
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('submit-button').style.display = 'none';
  }

  function renderPalette() {
    const palette = document.getElementById('question-palette');
    palette.innerHTML = '';
    questions.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.textContent = idx + 1;
      btn.className = 'palette-item';
      const key = `q${idx + 1}`;
      if (answers[key] === questions[idx].answer) {
        btn.classList.add('answered');
      } else if (answers[key]) {
        btn.classList.add('wrong');
      }
      if (idx === current) btn.classList.add('current');
      btn.addEventListener('click', () => {
        current = idx;
        renderQuestion();
      });
      palette.appendChild(btn);
    });
  }

  function renderQuestion() {
    renderPalette();
    const q = questions[current];
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
      <p>${q.text}</p>
      ${q.options.map(o => `
        <label>
          <input type="radio" name="option" value="${o.value}"> ${o.label}
        </label>
      `).join('')}
    `;

    const key = `q${current + 1}`;
    if (answers[key]) {
      document.querySelectorAll('input[name="option"]').forEach(i => {
        i.disabled = true;
        if (i.value === answers[key]) {
          i.checked = true;
          if (i.value === questions[current].answer) {
            i.parentElement.classList.add('correct-answer');
          } else {
            i.parentElement.classList.add('wrong-answer');
          }
        }
      });
      document.getElementById('submit-button').disabled = true;
    } else {
      showFeedback('');
      document.getElementById('submit-button').disabled = false;
      disableRestart();
    }
  }

  function handleSubmit() {
    const selected = document.querySelector('input[name="option"]:checked');
    const key = `q${current + 1}`;
    answers[key] = selected ? selected.value : null;
    const correct = questions[current].answer;

    if (selected) {
      if (selected.value === correct) {
        if (current < questions.length - 1) {
          showFeedback('Correto!');
        }
        selected.parentElement.classList.add('correct-answer');
      } else {
        const label = questions[current].options.find(o => o.value === correct).label;
        if (current < questions.length - 1) {
          showFeedback(`Incorreto, resposta certa: ${label}`);
        }
        selected.parentElement.classList.add('wrong-answer');
      }
      disableOptions();
      document.getElementById('submit-button').disabled = true;
    } else {
      showFeedback('Questão em branco, pulando para próxima.');
    }

    setTimeout(() => {
      const total = questions.length;
      let nextIndex = null;
      for (let i = 1; i <= total; i++) {
        const idx = (current + i) % total;
        if (!answers[`q${idx + 1}`]) {
          nextIndex = idx;
          break;
        }
      }

      if (nextIndex !== null) {
        current = nextIndex;
        renderQuestion();
      } else {
        endQuiz();
      }
    }, 800);
  }

  function disableOptions() {
    document.querySelectorAll('input[name="option"]').forEach(i => i.disabled = true);
  }

  function showFeedback(msg) {
    document.getElementById('feedback').textContent = msg;
  }

  function showRestart() {
    document.getElementById('restart-button').style.display = 'inline-block';
    document.getElementById('submit-button').style.display = 'none';
  }

  function disableRestart() {
    document.getElementById('restart-button').style.display = 'none';
    document.getElementById('submit-button').style.display = 'inline-block';
  }

  function handleRestart() {
    window.location.reload();
  }

  function endQuiz() {
    const total = questions.length;
    const acertos = questions.reduce((sum, q, idx) => (
      sum + (answers[`q${idx + 1}`] === q.answer ? 1 : 0)
    ), 0);

    const percent = Math.round((acertos / total) * 100);
    const nome = document.getElementById('nome-usuario')?.value || 'Candidato';
    const cpf = document.getElementById('cpf-usuario')?.value || '---';
    const autoescola = document.getElementById('autoescola-usuario')?.value || '---';
    const status = percent >= passThreshold
      ? 'Parabéns! Você foi aprovado.'
      : 'Reprovado. Tente novamente.';

    document.getElementById('quiz-container').innerHTML = `
      <h2>Fim do Simulado</h2>
      <p><strong>${nome}</strong> (CPF: ${cpf}) - Autoescola: ${autoescola}</p>
      <p>Você acertou ${acertos} de ${total} (${percent}%).</p>
      <p>${status}</p>
    `;
    showRestart();
  }

  // Iniciar aplicação
  init();
})();