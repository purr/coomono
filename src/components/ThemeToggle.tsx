import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../theme/ThemeContext';

const ToggleButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.highlightMed};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: ${({ theme }) => theme.highlightMed};
  }
`;

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <ToggleButton onClick={toggleTheme} aria-label="Toggle theme">
      {isDark ? '☀️' : '🌙'}
    </ToggleButton>
  );
};