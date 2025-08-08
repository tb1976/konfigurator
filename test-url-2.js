const url = 'http://localhost:3000/?flasche=flasche2&kapsel=kapselSchwMatt&korken=korkNatur&weinfarbe=tinto&etikettSrc=https%3A%2F%2Fvdli.ninoxdb.com%2Fshare%2Fbt3k5a2cs7xzk018s4pefw6h96mwk7n0kd1m';

const urlObj = new URL(url);
const params = new URLSearchParams(urlObj.search);

console.log('URL-Parameter:');
for (const [key, value] of params.entries()) {
  console.log(key + ':', value);
}

console.log('\nEtikett-URL dekodiert:');
console.log(decodeURIComponent(params.get('etikettSrc')));
