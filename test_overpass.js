const http = require('http');

const data = JSON.stringify({
  query: `[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:5000,-19.916667,-43.933333);
  way["amenity"="restaurant"](around:5000,-19.916667,-43.933333);
);
out body center 5;`
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/overpass',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    json.elements.forEach(el => {
      const lat = el.lat || (el.center && el.center.lat);
      const lon = el.lon || (el.center && el.center.lon);
      console.log(`${el.tags.name} | ${el.type}/${el.id} | ${lat} | ${lon}`);
    });
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
