import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initThemeFromStorage } from './utils/theme';
import { loadSettings, applySettingsToDocument } from './utils/settings';
import { setFormatCurrencyOptions } from './utils/calculations';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import App from './App.tsx';

initThemeFromStorage();
const bootSettings = loadSettings();
applySettingsToDocument(bootSettings);
setFormatCurrencyOptions({ currency: bootSettings.currency });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
