const fs = require('fs');
const path = require('path');

const testFiles = [
    { name: '1mb.bin', size: 1 * 1024 * 1024 },
    { name: '5mb.bin', size: 5 * 1024 * 1024 },
    { name: '10mb.bin', size: 10 * 1024 * 1024 },
    { name: '25mb.bin', size: 25 * 1024 * 1024 },
    { name: '50mb.bin', size: 50 * 1024 * 1024 }
];

const filesDir = path.join(__dirname, '../backend/files');

if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

testFiles.forEach(file => {
    const filePath = path.join(filesDir, file.name);
    
    if (!fs.existsSync(filePath)) {
        console.log(`Generating ${file.name}...`);
        const buffer = Buffer.alloc(file.size, Math.random().toString());
        fs.writeFileSync(filePath, buffer);
        console.log(`✓ ${file.name} created`);
    } else {
        console.log(`✓ ${file.name} already exists`);
    }
});

console.log('Test files generation complete!');
