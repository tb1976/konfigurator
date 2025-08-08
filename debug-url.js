// Test: Vollständige URL mit etikettSrc
const testUrl = 'http://localhost:3000/?flasche=flasche2&kapsel=kapselSchwMatt&korken=korkNatur&weinfarbe=tinto&etikettSrc=' + 
                encodeURIComponent('https://vdli.ninoxdb.com/share/bt3k5a2cs7xzk018s4pefw6h96mwk7n0kd1m');

console.log('Test-URL:');
console.log(testUrl);

console.log('\nURL-Länge:', testUrl.length);

const urlObj = new URL(testUrl);
const params = new URLSearchParams(urlObj.search);

console.log('\nParameter:');
for (const [key, value] of params.entries()) {
  console.log(key + ':', value);
}
