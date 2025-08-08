const url = 'https://konfigurator.isla.wine/?flasche=flasche2&kapsel=keineKapsel&korken=korkMikro&weinfarbe=blanco&etikettSrc=https%3A%2F%2Fvdli.ninoxdb.com%2Fshare%2Fl7cd25r9okxo3w08boi8kr0ngf7x91em9zeg';

const urlObj = new URL(url);
const params = new URLSearchParams(urlObj.search);

console.log('URL-Parameter:');
for (const [key, value] of params.entries()) {
  console.log(key + ':', value);
}

console.log('\nEtikett-URL dekodiert:');
console.log(decodeURIComponent(params.get('etikettSrc')));

console.log('\nURL vollständig:');
console.log(url);

console.log('\nSearch-String:');
console.log(urlObj.search);
