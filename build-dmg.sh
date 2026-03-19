#!/bin/bash
# Build script for macOS DMG

echo "=== Building NordVPN Browser ==="

# Vérifier macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Ce script doit être exécuté sur macOS"
    exit 1
fi

# Installer dépendances
echo "📦 Installation des dépendances..."
npm install

# Build DMG
echo "🔨 Construction du DMG..."
npm run build:dmg

# Vérifier le résultat
if [ -f "dist/NordVPN Browser.dmg" ]; then
    echo "✅ DMG créé: dist/NordVPN Browser.dmg"
    echo ""
    echo "Pour installer:"
    echo "  open dist/NordVPN\\ Browser.dmg"
else
    echo "❌ Erreur lors de la création du DMG"
    ls -la dist/ 2>/dev/null || echo "Répertoire dist/ non créé"
fi
