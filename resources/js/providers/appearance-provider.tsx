import React, { createContext, useContext, useState, useEffect } from 'react';

type Appearance = 'light' | 'dark' | 'system';

interface AppearanceContextType {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>('system');

  useEffect(() => {
    // Check for saved preference in localStorage
    const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
    if (savedAppearance) {
      setAppearance(savedAppearance);
    }

    // Apply the theme
    applyTheme(savedAppearance || 'system');
  }, []);

  const applyTheme = (mode: Appearance) => {
    const isDark = 
      mode === 'dark' || 
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark', isDark);
  };

  const handleAppearanceChange = (newAppearance: Appearance) => {
    setAppearance(newAppearance);
    localStorage.setItem('appearance', newAppearance);
    applyTheme(newAppearance);
  };

  return (
    <AppearanceContext.Provider 
      value={{ 
        appearance, 
        setAppearance: handleAppearanceChange 
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
