// --- API ANAHTARLARI ---
const NEWSAPI_KEY = "70604d607009430a83bc49f57e1331d8";
const NASA_API_KEY = "3592a9f7-befc-4a50-afc8-d2fd2d0ff897";

// --- API URL’LERİ ---
const USGS_ENDPOINT = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=3&limit=50&orderby=time`;
const NASA_EONET_ENDPOINT = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&api_key=${NASA_API_KEY}`;
const NEWSAPI_ENDPOINT = `https://newsapi.org/v2/everything?q=earthquake OR fire OR flood OR disaster&language=tr&pageSize=20&apiKey=${NEWSAPI_KEY}`;

// --- Leaflet Harita Kurulumu ---
const map = L.map('map').setView([39, 35], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marker layer’ları
const quakeLayer = L.layerGroup().addTo(map);
const nasaLayer = L.layerGroup().addTo(map);

// --- İkonlar ---
const quakeIcon = L.icon({
  iconUrl: 'assets/earthquake.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30]
});
const fireIcon = L.icon({
  iconUrl: 'assets/fire.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

// --- Deprem verisi çek ---
async function loadQuakes() {
  quakeLayer.clearLayers();
  document.getElementById('quake-list').innerText = "Depremler yükleniyor...";
  try {
    const res = await fetch(USGS_ENDPOINT);
    const data = await res.json();

    const listEl = document.getElementById('quake-list');
    listEl.innerHTML = "";

    data.features.forEach(feature => {
      const coords = feature.geometry.coordinates; // [lng, lat, depth]
      const props = feature.properties;
      const lat = coords[1];
      const lng = coords[0];
      const depth = coords[2];
      const mag = props.mag;
      const place = props.place;
      const time = new Date(props.time).toLocaleString();

      // Marker oluştur
      const marker = L.marker([lat, lng], { icon: quakeIcon })
        .bindPopup(`<b>${place}</b><br>Büyüklük: ${mag} Mw<br>Derinlik: ${depth} km<br>${time}`)
        .addTo(quakeLayer);

      // Liste elemanı oluştur
      const item = document.createElement('div');
      item.className = "quake-item";
      item.innerHTML = `<b>${place}</b> <small>(${mag} Mw)</small><br><small>${time}</small>`;
      item.onclick = () => {
        map.setView([lat, lng], 7);
        marker.openPopup();
      };
      listEl.appendChild(item);
    });

  } catch (error) {
    console.error("Deprem verisi yüklenemedi:", error);
    document.getElementById('quake-list').innerText = "Deprem verisi yüklenemedi.";
  }
}

// --- NASA EONET afet verisi çek ---
async function loadNasaEvents() {
  nasaLayer.clearLayers();
  try {
    const res = await fetch(NASA_EONET_ENDPOINT);
    const data = await res.json();

    data.events.forEach(event => {
      event.geometry.forEach(geo => {
        const coords = geo.coordinates; // [lng, lat]
        const title = event.title;
        const category = event.categories[0].title;
        const date = new Date(geo.date).toLocaleString();

        // Yangın veya afet türüne göre icon seç (örnek: yangın)
        const icon = category.toLowerCase().includes("fire") ? fireIcon : quakeIcon;

        L.marker([coords[1], coords[0]], { icon })
          .bindPopup(`<b>${title}</b><br>Kategori: ${category}<br>Tarih: ${date}`)
          .addTo(nasaLayer);
      });
    });
  } catch (error) {
    console.error("NASA afet verisi yüklenemedi:", error);
  }
}

// --- Haberler yükle ---
async function loadNews() {
  const newsEl = document.getElementById('news-list');
  newsEl.innerText = "Haberler yükleniyor...";
  try {
    const res = await fetch(NEWSAPI_ENDPOINT);
    const data = await res.json();

    newsEl.innerHTML = "";
    data.articles.forEach(article => {
      const div = document.createElement('div');
      div.className = "news-item";
      div.innerHTML = `<b>${article.title}</b><br><small>${new Date(article.publishedAt).toLocaleString()}</small><br><a href="${article.url}" target="_blank" rel="noopener">Habere git</a>`;
      newsEl.appendChild(div);
    });
  } catch (error) {
    console.error("Haberler yüklenemedi:", error);
    newsEl.innerText = "Haberler yüklenemedi.";
  }
}

// --- Sayfa yüklendiğinde verileri çek ---
window.onload = () => {
  loadQuakes();
  loadNasaEvents();
  loadNews();

  // 10 dakikada bir otomatik yenile
  setInterval(() => {
    loadQuakes();
    loadNasaEvents();
    loadNews();
  }, 10 * 60 * 1000);
};
