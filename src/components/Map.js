import React, { Component } from 'react';
// import L from 'leaflet';
import L from 'mapbox.js';
import GeoJSONTileLayer from '../lib/geojson-tile-layer';

export default class Map extends Component {
  componentDidMount() {
    this.map = L.mapbox.map(this.mapElement, 'mapbox.streets', {
      center: [51.505, -0.09],
      zoom: 13,
      maxZoom: 19,
      minZoom: 2,
      accessToken: 'pk.eyJ1Ijoic296aWFsaGVsZGVuIiwiYSI6IldvNHpkUUkifQ.5lLzFYw4MmAUkqLMoEcI3g',
    });

    const url = 'http://localhost:3001/nodes/{x}/{y}/{z}.geojson?limit=25';
    this.map.addLayer(new GeoJSONTileLayer(url, {
      pointToLayer(feature, latlng) {
        return new L.Marker(latlng);
      },
    }));
  }

  render() {
    return (<section ref={el => (this.mapElement = el)} />);
  }
}
