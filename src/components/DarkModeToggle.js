import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { Sun, Moon } from 'lucide-react'; // Diese Icons müssen installiert sein, z.B. über `lucide-react`

export default function DarkModeToggle() {
  const { darkMode, setDarkMode } = useDarkMode();

  const handleToggle = () => {
    setDarkMode(!darkMode); // Umschalten des Dark Modes
  };

  return (
    <button onClick={handleToggle} className="dark-mode-toggle">
      {darkMode ? (
        <Moon size={24} />  // Zeige den Mond-Button, wenn der Dark Mode aktiviert ist
      ) : (
        <Sun size={24} />  // Zeige den Sonne-Button, wenn der Dark Mode deaktiviert ist
      )}
    </button>
  );
}
