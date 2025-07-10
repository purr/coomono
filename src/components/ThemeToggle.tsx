import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../theme/ThemeContext';

const ToggleButton = styled.button`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.highlightMed};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.highlightMed};
    transform: scale(1.05);
  }
`;

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <ToggleButton onClick={toggleTheme} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      {isDark ? '☀️' : '🌙'}
    </ToggleButton>
  );
};