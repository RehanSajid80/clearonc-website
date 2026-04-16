const fs = require('fs');
const zlib = require('zlib');

const rawPdf = fs.readFileSync('ClearOnc Brand Guidelines.pdf');
const pdfStr = rawPdf.toString('latin1');

// Find all stream blocks and decompress them
const streamPositions = [];
let pos = 0;
while ((pos = pdfStr.indexOf('stream\r\n', pos)) !== -1) {
    streamPositions.push(pos + 8);
    pos += 8;
}
pos = 0;
while ((pos = pdfStr.indexOf('stream\n', pos)) !== -1) {
    if (pos > 0 && pdfStr[pos-1] !== '\r') {
        streamPositions.push(pos + 7);
    }
    pos += 7;
}

console.log('Found', streamPositions.length, 'streams');
console.log('');

let allFonts = new Set();
let allColors = new Set();
let allText = '';
let brandStreams = [];

for (const start of streamPositions) {
    const end = pdfStr.indexOf('endstream', start);
    if (end === -1) continue;
    
    const streamData = rawPdf.slice(start, end);
    
    try {
        const decompressed = zlib.inflateSync(streamData).toString('latin1');
        
        // Look for BaseFont/FontName in decompressed content
        let match;
        const bfPattern = /BaseFont[^\/]*\/([^\s\/>]+)/g;
        while ((match = bfPattern.exec(decompressed)) !== null) {
            allFonts.add(match[1]);
        }
        const fnPattern = /FontName[^\/]*\/([^\s\/>]+)/g;
        while ((match = fnPattern.exec(decompressed)) !== null) {
            allFonts.add(match[1]);
        }
        
        // Look for Tf font setting operations
        const tfPattern = /\/([^\s]+)\s+[\d.]+\s+Tf/g;
        while ((match = tfPattern.exec(decompressed)) !== null) {
            allFonts.add('Tf:' + match[1]);
        }
        
        // Look for RGB color operations
        const rgbOps = decompressed.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(rg|RG)/g);
        if (rgbOps) {
            rgbOps.forEach(op => allColors.add(op));
        }
        
        // Look for text show operations
        const textOps = decompressed.match(/\(([^)]*)\)\s*Tj/g);
        if (textOps) {
            textOps.forEach(t => allText += t + '\n');
        }
        const textArrayOps = decompressed.match(/\[([^\]]*)\]\s*TJ/g);
        if (textArrayOps) {
            textArrayOps.forEach(t => allText += t + '\n');
        }
        
        // Check for brand keywords
        if (decompressed.match(/color|font|hex|rgb|cmyk|brand|palette|#[0-9a-fA-F]{6}/i)) {
            brandStreams.push(decompressed.substring(0, 500));
        }
        
        // Check if it's a content stream with actual drawing commands
        if (decompressed.includes('BT') && decompressed.includes('ET')) {
            // Extract text between BT and ET
            const btEtPattern = /BT([\s\S]*?)ET/g;
            while ((match = btEtPattern.exec(decompressed)) !== null) {
                const block = match[1];
                // Find all text strings
                const strPattern = /\(([^)]*)\)/g;
                let strMatch;
                while ((strMatch = strPattern.exec(block)) !== null) {
                    if (strMatch[1].trim()) {
                        allText += strMatch[1] + ' ';
                    }
                }
                // Find hex-encoded text
                const hexStrPattern = /<([0-9A-Fa-f]+)>/g;
                while ((strMatch = hexStrPattern.exec(block)) !== null) {
                    // Try to decode hex as UTF-16BE (common in PDFs)
                    const hex = strMatch[1];
                    if (hex.length >= 4) {
                        let decoded = '';
                        for (let i = 0; i < hex.length; i += 4) {
                            const code = parseInt(hex.substring(i, i+4), 16);
                            if (code > 31 && code < 127) {
                                decoded += String.fromCharCode(code);
                            }
                        }
                        if (decoded.trim()) allText += decoded + ' ';
                    }
                }
            }
        }
        
    } catch (e) {
        // Not FlateDecode or decompression failed
    }
}

console.log('=== FONTS FOUND IN STREAMS ===');
allFonts.forEach(f => console.log(f));

console.log('');
console.log('=== COLORS FOUND IN STREAMS ===');
allColors.forEach(c => {
    const parts = c.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(rg|RG)/);
    if (parts) {
        const r = Math.round(parseFloat(parts[1]) * 255);
        const g = Math.round(parseFloat(parts[2]) * 255);
        const b = Math.round(parseFloat(parts[3]) * 255);
        const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
        console.log(parts[4] + ': (' + parts[1] + ', ' + parts[2] + ', ' + parts[3] + ') => RGB(' + r + ',' + g + ',' + b + ') ' + hex.toUpperCase());
    }
});

console.log('');
console.log('=== ALL EXTRACTED TEXT ===');
console.log(allText);

if (brandStreams.length > 0) {
    console.log('');
    console.log('=== STREAMS WITH BRAND KEYWORDS (first 500 chars each) ===');
    brandStreams.forEach((s, i) => {
        console.log('--- Stream ' + (i+1) + ' ---');
        console.log(s);
    });
}
