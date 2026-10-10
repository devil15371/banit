/**
 * Geohash-based Crisis Channels
 * Adopted from BitChat's location-based channels architecture.
 * Partitions mesh channels into privacy-preserving geographic bounding boxes
 * (e.g., 5-character geohash covers roughly a 4.9 km x 4.9 km protest perimeter)
 * without exposing raw GPS or cellular telemetry.
 */

// Popular tactical zones and demo sectors
export const TACTICAL_GEOHASH_ZONES = [
  { geohash: 'ttnf2', name: 'Delhi: Jantar Mantar / Connaught Pl', lat: 28.6271, lon: 77.2166 },
  { geohash: 'ttnf8', name: 'Delhi: India Gate / Kartavya Path', lat: 28.6129, lon: 77.2295 },
  { geohash: 'ttncu', name: 'Delhi: Red Fort / Old Delhi', lat: 28.6562, lon: 77.2410 },
  { geohash: 'te7uf', name: 'Mumbai: Azad Maidan / CST', lat: 18.9402, lon: 72.8354 },
  { geohash: 'tdr1v', name: 'Kolkata: Esplanade / Maidan', lat: 22.5645, lon: 88.3510 },
  { geohash: 'custom', name: 'Local Ad-hoc Sector (#mesh-local)', lat: 0, lon: 0 }
];

export function getGeohashChannelName(geohashCode) {
  return `#geo-${geohashCode}`;
}
