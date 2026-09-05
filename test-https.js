const https = require('https');
const querystring = require('querystring');

const query = "[out:json];node(around:5000,-19.9227,-43.9451)[\"amenity\"=\"restaurant\"];out 2;";
const postData = querystring.stringify({ data: query });

const options = {
  hostname: 'overpass-api.de',
  port: 443,
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Elements:', data.elements.length);
    } catch(e) {
      console.log('Error parsing:', e);
      console.log('Body:', body.substring(0, 100));
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
