import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, getSettings, saveSettings } from '../betaSession';
import { fetchRemoteSettings, pushRemoteSettings } from '../api';
import { LOCALES, messages, translate } from './messages';

const LocaleContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  locales: LOCALES,
  syncStatus: 'local',
});

function detectInitialLocale() {
  const saved = getSettings()?.locale;
  if (saved === 'hi' || saved === 'en') return saved;
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  return nav.toLowerCase().startsWith('hi') ? 'hi' : 'en';
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale);
  const [syncStatus, setSyncStatus] = useState('local');

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Keep React state aligned when account restore writes settings to localStorage.
  useEffect(() => {
    const onSettings = (event) => {
      const next = event?.detail?.locale || getSettings()?.locale;
      if (next === 'hi' || next === 'en') setLocaleState(next);
    };
    window.addEventListener('kundali-settings', onSettings);
    return () => window.removeEventListener('kundali-settings', onSettings);
  }, []);

  // Pull remote settings after invite so language follows the account across devices.
  useEffect(() => {
    let cancelled = false;
    const session = getSession();
    if (!session?.email || !session?.inviteCode) return undefined;

    (async () => {
      const remote = await fetchRemoteSettings(session);
      if (cancelled) return;
      if (remote?.locale === 'hi' || remote?.locale === 'en') {
        setLocaleState(remote.locale);
        saveSettings({ ...getSettings(), ...remote, locale: remote.locale });
        setSyncStatus('synced');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next) => {
    const localeCode = next === 'hi' ? 'hi' : 'en';
    setLocaleState(localeCode);
    const settings = saveSettings({ ...getSettings(), locale: localeCode });
    const session = getSession();
    if (!session?.email || !session?.inviteCode) {
      setSyncStatus('local');
      return;
    }
    setSyncStatus('syncing');
    const ok = await pushRemoteSettings(session, settings);
    setSyncStatus(ok ? 'synced' : 'error');
  }, []);

  const t = useCallback((key) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      locales: LOCALES,
      messages: messages[locale] || messages.en,
      syncStatus,
    }),
    [locale, setLocale, t, syncStatus]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
