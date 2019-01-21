// @flow

import URLDataCache from './URLDataCache';
import env from '../env';

export default class GeoJSONTileCache extends URLDataCache<DataSource> {}

export const geoJSONTileCache = new GeoJSONTileCache({
  ttl: 1000 * 60 * 60,
});
