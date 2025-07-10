import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { rosePineTheme, rosePineDawnTheme } from './theme';
import type { ThemeContextType } from './theme';

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: rosePineTheme,
  isDark: true,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get theme preference from local storage or default to dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const theme = isDark ? rosePineTheme : rosePineDawnTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Save theme preference to local storage when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Also update body background to match theme
    document.body.style.backgroundColor = theme.base;
    document.body.style.color = theme.text;
  }, [isDark, theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};