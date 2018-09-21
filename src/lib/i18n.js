// @flow

import uniq from 'lodash/uniq';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';
import flatten from 'lodash/flatten';
import { addLocale, useLocales } from 'ttag';
import { getQueryParams } from './queryParams';
import * as translations from './translations.json';

export type LocalizedString =
  | string
  | {
      [key: string]: string,
    };

export type Translations = {
  locale: string,
  poData: any,
};

export const defaultLocale = 'en-US';

export function applyTranslations(translations: Translations[]) {
  const localesToUse = [];

  // register with ttag
  for (const t of translations) {
    addLocale(t.locale, t.poData);
    localesToUse.push(t.locale);
  }

  // set locale in ttag
  useLocales(localesToUse);

  // update active locales
  // we need to modify the actual array content, so that all imported references get the changes
  currentLocales.splice(0, currentLocales.length);
  currentLocales.push(...localesToUse);
}

// Returns the locale as language code without country code etc. removed (for
// example "en" if given "en-GB").

export function localeWithoutCountry(locale: string): string {
  return locale.substring(0, 2);
}

export const currentLocales = uniq([defaultLocale, localeWithoutCountry(defaultLocale)]).filter(
  Boolean
);

// Returns an expanded list of preferred locales.
export function expandedPreferredLocales(languages: string[]): string[] {
  const hasWindow = typeof window !== 'undefined';
  if (!languages && hasWindow && window.navigator && window.navigator.languages) {
    languages = window.navigator.languages;
  }

  // Note that some browsers don't support navigator.languages
  // TODO remove from here
  const overriddenLocale = getQueryParams().locale;
  let localesPreferredByUser = [...languages];

  if (overriddenLocale) {
    localesPreferredByUser.unshift(overriddenLocale);
  }

  const locales = localesPreferredByUser
    .concat([hasWindow ? window.navigator.language : null, defaultLocale])
    // Filter empty or undefined locales. Android 4.4 seems to have an undefined
    // window.navigator.language in WebView.
    .filter(Boolean);

  // Try all locales without country code, too
  return uniq(flatten(locales.map(l => [l, localeWithoutCountry(l)])));
}

export function translatedStringFromObject(localizedString: ?LocalizedString): ?string {
  if (!localizedString) return null;
  if (typeof localizedString === 'string') {
    return localizedString;
  }
  if (typeof localizedString === 'object') {
    const locales = currentLocales;
    for (let i = 0; i < locales.length; i++) {
      const translatedString = localizedString[locales[i]];
      if (translatedString) return translatedString;
    }
    const firstAvailableLocale = Object.keys(localizedString)[0];
    return localizedString[firstAvailableLocale]; // return the untranslated string as last option
  }
  return null;
}

function getTranslationsForLocale(locale) {
  return translations[locale];
}

export function loadExistingLocalizationByPreference(locales: string[]): Translations[] {
  if (locales.length === 0) {
    return [];
  }

  const loadedTranslations = locales
    .map(locale => getTranslationsForLocale(locale))
    .filter(Boolean);
  const loadedLocales = loadedTranslations.map(t => t && t.headers && t.headers.language);
  console.log('Currently loaded locales:', loadedLocales);
  const missingLocales = difference(locales, loadedLocales);
  console.log('Missing locales:', missingLocales);

  if (missingLocales.length === 0) {
    return [];
  }

  // If the missing locale has no country suffix, maybe we find a loaded variant with a country
  // suffix that we can use instead.
  missingLocales.forEach(missingLocale => {
    if (missingLocale.length !== 2) {
      return;
    }
    const replacementLocale = loadedLocales.find(
      loadedLocale => localeWithoutCountry(loadedLocale) === missingLocale
    );
    if (replacementLocale) {
      console.log('Replaced requested', missingLocale, 'locale with data from', replacementLocale);
      const poData = getTranslationsForLocale(replacementLocale);
      loadedTranslations.push({ locale: missingLocale, poData });
      loadedLocales.push(missingLocale);
    }
  });

  const localesToUse = intersection(locales, loadedLocales).filter(Boolean);

  if (localesToUse.length === 0) {
    console.warn('Warning: No locales available after loading locales.', locales, loadedLocales);
  }

  return loadedTranslations.filter(t => localesToUse.includes(t.locale));
}

export function parseAcceptLanguageString(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(',')
    .map(item => {
      const [locale, q] = item.split(';');

      return {
        locale: locale.trim(),
        score: q ? parseFloat(q.slice(2)) || 0 : 1,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.locale);
}
