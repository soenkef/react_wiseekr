import React, { createContext, useState, useContext, useEffect } from 'react';

// Erstellen des DarkModeContext
const DarkModeContext = createContext();

// DarkModeProvider sorgt dafür, dass der Dark Mode für alle Komponenten verfügbar ist
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Speichern des Dark Mode-Zustands in localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
  }, []);

  useEffect(() => {
    // Wenn Dark Mode aktiviert ist, CSS-Klasse 'dark' zur body hinzufügen
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Hook, um den DarkMode-Zustand und die Funktion zum Umschalten zu verwenden
export const useDarkMode = () => useContext(DarkModeContext);
