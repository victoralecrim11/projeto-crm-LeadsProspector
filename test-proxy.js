async function run() {
  try {
    const response = await fetch('http://localhost:3000/api/overpass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: "[out:json];node(around:5000,-19.9227,-43.9451)[\"amenity\"=\"restaurant\"];out 2;" }),
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
