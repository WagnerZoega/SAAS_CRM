const axios = require('axios');
const fs = require('fs');

const url = 'https://photo.yupoo.com/minkang/64f9101c/b8d1f308.jpg';
const referers = [
    'https://yupoo.com/',
    'https://www.yupoo.com/',
    'https://photo.yupoo.com/',
    'https://minkang.x.yupoo.com/',
    ''
];

async function test() {
    for (const ref of referers) {
        try {
            console.log(`Testando referer: "${ref}"`);
            const res = await axios.get(url, {
                headers: {
                    'Referer': ref,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer'
            });
            console.log(`SUCESSO com referer: "${ref}" (Status: ${res.status})`);
            fs.writeFileSync('success_test.jpg', res.data);
            return;
        } catch (err) {
            console.log(`FALHA com referer: "${ref}" (Status: ${err.response?.status})`);
        }
    }
}

test();
