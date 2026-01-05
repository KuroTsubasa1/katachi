export const useOpenStreetMap = () => {
  const getMapEmbedUrl = (location: string, zoom: number = 15) => {
    // OpenStreetMap embed URL
    // For a more interactive map, we'd need to integrate Leaflet.js
    // For now, return a static map URL using OSM tiles
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}`
  }

  const getStaticMapUrl = (lat: number, lon: number, zoom: number = 15) => {
    // Return iframe-embeddable URL for OSM
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`
  }

  return {
    getMapEmbedUrl,
    getStaticMapUrl
  }
}
