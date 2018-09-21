// @flow
import UAParser from 'ua-parser-js';
import Head from 'next/head';

import {
  expandedPreferredLocales,
  loadExistingLocalizationByPreference,
  type Translations,
} from '../lib/i18n';

import Categories, { type CategoryLookupTables } from '../lib/Categories';
import { type UAResult } from '../lib/userAgent';

import {
  fetchClientSideConfiguration,
  type ClientSideConfiguration,
} from '../lib/ClientSideConfiguration';

import SearchData from './SearchData';
import PlaceDetailsData from './PlaceDetailsData';
import MapData from './MapData';

type AppProps = {
  userAgent: UAResult,
  categories: CategoryLookupTables,
  translations: Translations[],
  clientSideConfiguration: ClientSideConfiguration,
};

type DataTableQuery = {
  [key: string]: string,
};

export type DataTableEntry<Props> = {
  getInitialProps?: (query: DataTableQuery, isServer: boolean) => Promise<Props>,
  getHead?: (props: Props & AppProps) => ?React$Element<Head>,
  clientStoreInitialProps?: (props: Props & AppProps) => void,
};

type DataTable = {
  [key: string]: DataTableEntry<any>,
};

const dataTable: DataTable = Object.freeze({
  place_detail: PlaceDetailsData,
  search: SearchData,
  map: MapData,
});

export function getInitialProps(
  {
    routeName,
    ...query
  }: {
    routeName: string,
    [key: string]: string,
  },
  isServer: boolean
) {
  const dataItem = dataTable[routeName];

  if (!dataItem || !dataItem.getInitialProps) {
    return {};
  }

  return dataItem.getInitialProps(query, isServer);
}

export async function getAppInitialProps(
  {
    userAgentString,
    languages,
    hostName,
    ...query
  }: {
    userAgentString: string,
    languages: string[],
    hostName: string,
    [key: string]: string,
  },
  isServer: boolean
): Promise<AppProps> {
  // flow type is not synced with actual apis
  const userAgentParser = new UAParser(userAgentString);
  const userAgent = ((userAgentParser.getResult(): any): UAResult);

  const clientSideConfiguration = clientCache.clientSideConfiguration
    ? clientCache.clientSideConfiguration
    : await fetchClientSideConfiguration(hostName);

  const locales = expandedPreferredLocales(languages);
  const translations = clientCache.translations
    ? clientCache.translations
    : await loadExistingLocalizationByPreference(locales);

  const categories = clientCache.categories
    ? clientCache.categories
    : await Categories.generateLookupTables({ locale: locales[0] });

  return { userAgent, translations, categories, clientSideConfiguration };
}

const clientCache: $Shape<AppProps> = {};

export function clientStoreAppInitialProps(props: AppProps) {
  clientCache.translations = props.translations;
  clientCache.categories = props.categories;
  clientCache.clientSideConfiguration = props.clientSideConfiguration;
}

export function clientStoreInitialProps(routeName: string, props: any) {
  const dataItem = dataTable[routeName];

  if (!dataItem || !dataItem.clientStoreInitialProps) {
    return {};
  }

  return dataItem.clientStoreInitialProps(props);
}

export function getHead(routeName: string, props: any) {
  const dataItem = dataTable[routeName];

  if (!dataItem || !dataItem.getHead) {
    return null;
  }

  return dataItem.getHead(props);
}
