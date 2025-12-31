#!/bin/bash

echo "🚀 Déploiement du frontend Mega-data..."

# Construire
echo "📦 Construction du projet..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Échec de la construction"
  exit 1
fi

# Déployer
echo "☁️  Déploiement sur Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
  echo "❌ Échec du déploiement"
  exit 1
fi

echo "✅ Déploiement terminé avec succès !"
echo "🌐 Frontend: https://mega-data-frontend.vercel.app"
echo "🔗 Backend: https://web-production-b92a.up.railway.app"