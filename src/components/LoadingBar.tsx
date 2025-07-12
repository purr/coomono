import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingBarProps {
  isLoading: boolean;
}

const progress = keyframes`
  0% { width: 0; opacity: 1; }
  50% { width: 50%; opacity: 1; }
  80% { width: 80%; opacity: 1; }
  95% { width: 95%; opacity: 1; }
  100% { width: 100%; opacity: 0; }
`;

const LoadingBarContainer = styled.div<{ active: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: transparent;
  z-index: 1000;
  pointer-events: none;
  visibility: ${props => props.active ? 'visible' : 'hidden'};
`;

const LoadingProgress = styled.div<{ active: boolean }>`
  height: 100%;
  background: ${({ theme }) => theme.rose};
  transition: width 0.3s ease;
  animation: ${progress} 2s ease-in-out;
  animation-fill-mode: forwards;
  width: ${props => props.active ? '0%' : '0%'};
`;

const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      // Small delay to ensure animation starts properly
      setTimeout(() => {
        setActive(true);
      }, 10);
    } else {
      setActive(false);
      // Keep the bar visible for a short period after loading completes
      const timeout = setTimeout(() => {
        setShow(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <LoadingBarContainer active={show}>
      <LoadingProgress active={active} />
    </LoadingBarContainer>
  );
};

export default LoadingBar;