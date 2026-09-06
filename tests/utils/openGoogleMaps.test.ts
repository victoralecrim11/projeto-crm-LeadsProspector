import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGoogleMapsBusinessSearchUrl,
  buildGoogleMapsSearchUrl,
  buildOpenStreetMapLocationUrl,
} from '../../src/utils/openGoogleMaps';

test('busca comercial combina nome genérico, categoria e cidade', () => {
  const url = new URL(buildGoogleMapsBusinessSearchUrl({
    name: 'Vitória',
    category: 'Clínica Odontológica',
    city: 'Catalão',
    state: 'GO',
    geoLat: -18.1659,
    geoLng: -47.944,
    dataSource: 'real',
  }));

  assert.equal(
    url.searchParams.get('query'),
    'Vitória, Clínica Odontológica, Catalão, GO',
  );
});

test('link de coordenada do Google Maps preserva o ponto exato do OSM', () => {
  const url = new URL(buildGoogleMapsSearchUrl({
    name: 'Salão Renova',
    geoLat: -19.9196454,
    geoLng: -43.9477558,
    dataSource: 'real',
  }));

  assert.equal(url.searchParams.get('query'), '-19.9196454,-43.9477558');
});

test('link do OpenStreetMap preserva latitude, longitude e zoom', () => {
  const url = buildOpenStreetMapLocationUrl({
    name: 'Salão Renova',
    geoLat: -19.9196454,
    geoLng: -43.9477558,
  });

  assert.equal(
    url,
    'https://www.openstreetmap.org/?mlat=-19.9196454&mlon=-43.9477558#map=19/-19.9196454/-43.9477558',
  );
});
