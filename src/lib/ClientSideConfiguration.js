// @flow

import config from './config';
import fetch from './fetch';

export type ClientSideConfiguration = {
  logoURL: string,
  allowedBaseURLs: Array<string>,
  includeSourceIds: Array<string>,
  excludeSourceIds: Array<string>,
  textContent: {
    onboarding: {
      headerMarkdown: string,
    },
    product: {
      name: string,
      claim: string,
    },
  },
  customMainMenuLinks: Array<Link>,
  addPlaceURL: string,
};

export async function fetchClientSideConfiguration(
  hostName: string
): Promise<ClientSideConfiguration> {
  const baseUrl = config.accessibilityCloudBaseUrl;
  const token = config.accessibilityCloudAppToken;
  const url = `${baseUrl}/apps/${hostName}.json?appToken=${token}`;

  const response = await fetch(url);
  const appJSON = await response.json();
  return appJSON.clientSideConfiguration;
}

export function getProductTitle(clientSideConfiguration: ClientSideConfiguration, title: ?string) {
  const { product } = clientSideConfiguration.textContent;

  if (!title) {
    return `${product.name} – ${product.claim}`;
  }

  return `${title} – ${product.name}`;
}
