import { createContext, useContext, useState, useCallback } from 'react';

const SettingsContext = createContext(null);

// Store API URL in sessionStorage (non-sensitive config)
const STORAGE_KEY = 'feedbackos_api_url';

export function SettingsProvider({ children }) {
  const [apiUrl, setApiUrlState] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) || ''
  );

  const setApiUrl = useCallback((url) => {
    sessionStorage.setItem(STORAGE_KEY, url);
    setApiUrlState(url);
  }, []);

  return (
    <SettingsContext.Provider value={{ apiUrl, setApiUrl }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
