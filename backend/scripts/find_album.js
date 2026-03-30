const fs = require('fs');
const catalogPath = 'd:/crm-camisas-tailandesas/img/catalog.json';
const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const searchTerm = 'BRAZIL'.toUpperCase();
const results = data.items.filter(item => 
    (item.name && item.name.toUpperCase().includes(searchTerm)) || 
    (item.original_title && item.original_title.toUpperCase().includes(searchTerm))
);

console.log(`Found ${results.length} items.`);
// Group by album to see one complete example
const albums = {};
results.forEach(item => {
    if (!albums[item.album_url]) albums[item.album_url] = [];
    albums[item.album_url].push({ view: item.view, url: item.source_url });
});

Object.keys(albums).slice(0, 3).forEach(url => {
    console.log(`\nAlbum: ${url}`);
    albums[url].forEach((p, i) => console.log(`  [${i+1}] View: ${p.view} -> ${p.url}`));
});
