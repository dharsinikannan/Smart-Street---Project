const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const files = ['en.json', 'es.json', 'hi.json'];

files.forEach(file => {
    const filePath = path.join(localesDir, file);
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            JSON.parse(content);
            console.log(`✅ ${file} is valid JSON.`);
        } else {
            console.error(`❌ ${file} is missing.`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ ${file} is invalid JSON: ${error.message}`);
        process.exit(1);
    }
});

console.log('All locale files are valid.');
