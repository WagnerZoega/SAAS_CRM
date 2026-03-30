const fs = require('fs');
const content = fs.readFileSync('d:\\saas-crm\\frontend\\src\\app\\admin\\page.tsx', 'utf8');

let braces = 0;
let parens = 0;
let curlies = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') curlies++;
    if (char === '}') curlies--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
}

console.log('Curlies:', curlies);
console.log('Parens:', parens);
console.log('Brackets:', brackets);
