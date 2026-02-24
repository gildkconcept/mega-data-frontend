@echo off
echo ========================================
echo  CORRECTION URGENTE URL BACKEND
echo ========================================

echo.
echo 1. Configuration de l'URL correcte...
echo REACT_APP_API_URL=https://web-production-b92a.up.railway.app > .env.local
echo ✅ Fichier .env.local créé

echo.
echo 2. Nettoyage des caches...
rd /s /q node_modules\.cache 2>nul
echo ✅ Cache nettoyé

echo.
echo 3. Redémarrage avec la bonne URL...
set REACT_APP_API_URL=https://web-production-b92a.up.railway.app
echo 🔧 URL définie: %REACT_APP_API_URL%

echo.
echo 4. Démarrage de l'application...
echo ========================================
npm start