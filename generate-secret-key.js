const crypto = require('crypto');
const fs = require('fs');

// Gera uma chave segura de 64 caracteres
const secretKey = crypto.randomBytes(32).toString('hex');

// Adiciona ou atualiza a chave no arquivo .env
const envFilePath = './.env';
const envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf-8') : '';
const updatedContent = envContent.includes('SECRET_KEY=')
    ? envContent.replace(/SECRET_KEY=.*/, `SECRET_KEY=${secretKey}`)
    : `${envContent}\nSECRET_KEY=${secretKey}`.trim();

fs.writeFileSync(envFilePath, updatedContent, 'utf-8');
console.log('Generated SECRET_KEY:', secretKey);
