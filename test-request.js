import http from 'http';
console.log('Sending request to 3001...');
const req = http.get('http://127.0.0.1:3001/api/deals?platform=steam&cc=us', (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', () => process.stdout.write('GOT_DATA\n'));
});
req.on('error', console.error);
req.setTimeout(30000, () => { console.log('TIMEOUT'); req.abort(); });
