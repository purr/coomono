import { createGlobalStyle } from 'styled-components';
import type { Theme } from './theme';

export const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  body {
    background-color: ${({ theme }) => theme.base};
    color: ${({ theme }) => theme.text};
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.5;
    min-height: 100vh;
  }

  a {
    color: ${({ theme }) => theme.rose};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  button {
    cursor: pointer;
    background: ${({ theme }) => theme.overlay};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.highlightMed};
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;

    &:hover {
      background: ${({ theme }) => theme.highlightMed};
    }

    &:active {
      background: ${({ theme }) => theme.highlightHigh};
    }
  }

  input, select {
    background: ${({ theme }) => theme.overlay};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.highlightMed};
    border-radius: 4px;
    padding: 8px 12px;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.rose};
    }
  }
`;