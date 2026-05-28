import http from 'http';
console.log('Sending request to 3000...');
const req = http.get('http://127.0.0.1:3000/api/deals?platform=steam&cc=us', (res) => {
  console.log('STATUS:', res.statusCode);
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log('GOT_DATA:', data.substring(0, 100)));
});
req.on('error', console.error);
req.setTimeout(80000, () => { console.log('TIMEOUT'); req.abort(); });
