import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initThemeFromStorage } from './utils/theme';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.tsx';

initThemeFromStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
