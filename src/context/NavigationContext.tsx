import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationContextProps {
  isNavigating: boolean;
  setIsNavigating: (value: boolean) => void;
  startNavigation: () => void;
  endNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextProps>({
  isNavigating: false,
  setIsNavigating: () => {},
  startNavigation: () => {},
  endNavigation: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();

  // Track location changes to detect navigation events
  useEffect(() => {
    endNavigation();
  }, [location]);

  // Navigation control functions
  const startNavigation = () => {
    setIsNavigating(true);
  };

  const endNavigation = () => {
    // Add a small delay to make sure loading bar is visible
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, setIsNavigating, startNavigation, endNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationContext;