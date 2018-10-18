// @flow

import URLDataCache from './URLDataCache';
import type { WheelmapFeaturePhotos } from '../Feature';
import env from '../env';

export default class WheelmapFeaturePhotosCache extends URLDataCache<?WheelmapFeaturePhotos> {
  getPhotosForFeature(
    featureId: string | number,
    options: { useCache: boolean } = { useCache: true }
  ): Promise<?WheelmapFeaturePhotos> {
    const wheelmapApiBaseUrl = env.public.wheelmap.baseUrl
      ? env.public.wheelmap.baseUrl
      : env.public.baseUrl || '/';

    return this.getData(
      `${wheelmapApiBaseUrl}/api/nodes/${featureId}/photos?api_key=${env.public.wheelmap.apiKey}`,
      options
    );
  }
}

export const wheelmapFeaturePhotosCache = new WheelmapFeaturePhotosCache();
