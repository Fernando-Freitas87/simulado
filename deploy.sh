#!/usr/bin/env bash
set -e

# === CONFIGURAÇÃO ===
PROJECT_DIR="/Users/fernandofreitas/Desktop/Projetos local/simulado"
REMOTE_URL="https://github.com/Fernando-Freitas87/simulado.git"
BRANCH="main"
COMMIT_MSG="Initial commit: estrutura do projeto Simulado DETRAN"

# Vai para a pasta do projeto
cd "$PROJECT_DIR"

# 1) Inicializa repositório, se necessário
if [ ! -d ".git" ]; then
  git init
  git branch -M "$BRANCH"
fi

# 2) Cria .gitignore básico, se ainda não existir
if [ ! -f ".gitignore" ]; then
  cat <<EOF > .gitignore
node_modules/
.env
*.log
EOF
fi

# 3) Adiciona tudo e faz commit (se já existir commit, ignora)
git add .
git commit -m "$COMMIT_MSG" || true

# 4) Configura remoto “origin”, se ainda não existir
if ! git remote | grep -q origin; then
  git remote add origin "$REMOTE_URL"
fi

# 5) Dá push para o GitHub
git push -u origin "$BRANCH"