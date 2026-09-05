const query = "[out:json];node(around:5000,-19.9227,-43.9451)[\"amenity\"=\"restaurant\"];out 2;";
const USER_AGENT = 'LeadsProspector-CRM/1.0';

async function run() {
  const endpoint = 'https://overpass.private.coffee/api/interpreter';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    console.log("Status:", response.status);
    if(response.ok) {
       const data = await response.json();
       console.log("Elements:", data.elements.length);
    } else {
       console.log("Error body:", await response.text());
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
