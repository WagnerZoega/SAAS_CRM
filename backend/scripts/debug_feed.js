const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent'],
    ],
  }
});

async function debugFeed() {
  console.log('--- DEBUG FEED ---');
  try {
    const feed = await parser.parseURL('https://mantosdofutebol.com.br/feed');
    const item = feed.items[0];
    console.log('Item keys:', Object.keys(item));
    console.log('Title:', item.title);
    console.log('Enclosure:', item.enclosure);
    console.log('MediaContent:', JSON.stringify(item.mediaContent, null, 2));
    if (item.content) {
        console.log('Content length:', item.content.length);
        console.log('Content snippet:', item.content.substring(0, 1000));
    }
  } catch (e) {
    console.error(e);
  }
}

debugFeed();
