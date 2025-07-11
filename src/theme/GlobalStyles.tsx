import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${({ theme }) => theme.base};
    color: ${({ theme }) => theme.text};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  a {
    color: ${({ theme }) => theme.pine};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      text-decoration: underline;
      color: ${({ theme }) => theme.foam};
    }
  }

  button {
    font-family: inherit;
  }

  /* Container styles */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
`;