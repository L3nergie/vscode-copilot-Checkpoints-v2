#!/bin/bash

# Script de déploiement pour l'extension MSCode

echo "Début du déploiement de l'extension MSCode..."

# Nettoyage
echo "Nettoyage des fichiers temporaires..."
rm -rf out/
rm -rf node_modules/
rm -f *.vsix

# Installation des dépendances
echo "Installation des dépendances..."
npm install

# Vérification des prérequis
echo "Vérification des prérequis..."
node node-prerequisites.js

# Compilation
echo "Compilation de l'extension..."
npm run compile

# Vérification de la présence des modules critiques
echo "Vérification des modules critiques..."
if [ ! -d "node_modules/fs-extra" ]; then
    echo "⚠️ Module fs-extra manquant! Réinstallation..."
    npm install fs-extra
fi

if [ ! -d "node_modules/adm-zip" ]; then
    echo "⚠️ Module adm-zip manquant! Réinstallation..."
    npm install adm-zip
fi

# Création du package VSIX
echo "Création du package VSIX..."
npx vsce package

echo "Déploiement terminé!"
echo "Vous pouvez maintenant installer l'extension avec la commande: code --install-extension *.vsix"
