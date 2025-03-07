#!/bin/bash

# Afficher l'en-tête
echo "======================================"
echo "Script de résolution des vulnérabilités"
echo "======================================"
echo ""

# Vérifier les permissions du dossier node_modules
echo "Correction des permissions du dossier node_modules..."
sudo chown -R $(whoami) ./node_modules
chmod -R u+w ./node_modules

# Nettoyer le cache npm
echo "Nettoyage du cache npm..."
npm cache clean --force

# Mise à jour des dépendances vulnérables
echo "Mise à jour des dépendances vulnérables..."
npm install minimist@latest mkdirp@latest --save

# Forcer la mise à jour des sous-dépendances
echo "Force la mise à jour des sous-dépendances..."
npm dedupe

# Installer la dernière version des modules d'audit de sécurité
echo "Installation des outils de sécurité..."
npm install -g npm-audit-resolver

# Analyser et résoudre automatiquement les problèmes
echo "Analyse et résolution des vulnérabilités..."
npx resolve-audit

echo ""
echo "======================================"
echo "Vérification finale des vulnérabilités"
echo "======================================"
npm audit

# Rendre le script exécutable
chmod +x fix-vulnerabilities.sh
