const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

// Vérifier si les modules requis sont présents
const requiredModules = ['fs-extra', 'adm-zip', 'path', 'os'];
const missingModules = [];

console.log('Vérification des prérequis pour l\'extension MSCode...');

for (const moduleName of requiredModules) {
    try {
        require.resolve(moduleName);
        console.log(`✓ Module ${moduleName} trouvé`);
    } catch (error) {
        console.error(`✗ Module ${moduleName} manquant`);
        missingModules.push(moduleName);
    }
}

if (missingModules.length > 0) {
    console.log(`Installation des modules manquants: ${missingModules.join(', ')}`);
    try {
        childProcess.execSync(`npm install ${missingModules.join(' ')} --no-save`, {
            stdio: 'inherit'
        });
        console.log('Modules installés avec succès!');
    } catch (error) {
        console.error('Erreur lors de l\'installation des modules:', error);
        process.exit(1);
    }
}

// Vérifier que les fichiers de sortie contiennent les références aux modules
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
    console.log('Dossier de sortie non trouvé. Compilation nécessaire...');
    try {
        childProcess.execSync('npm run compile', {
            stdio: 'inherit'
        });
        console.log('Compilation terminée avec succès!');
    } catch (error) {
        console.error('Erreur lors de la compilation:', error);
        process.exit(1);
    }
}

console.log('Prérequis vérifiés avec succès!');
