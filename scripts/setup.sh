#!/usr/bin/env bash
set -e
echo "== SoukQuik MVP — setup =="

echo "-> Backend: installation des dépendances"
(cd backend && npm install)

echo "-> Mobile app: installation des dépendances"
(cd mobile-app && npm install)

echo "-> Copie des fichiers .env si absents"
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f config/.env ] || cp config/.env.example config/.env

echo "Terminé. Lancez la base avec Docker puis 'npm run db:migrate && npm run db:seed' dans /backend."
