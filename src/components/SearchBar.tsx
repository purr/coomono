import React from 'react';
import styled from 'styled-components';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchContainer = styled.div`
  width: 100%;
  margin-bottom: 24px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 6px;
  background-color: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.highlightMed};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.iris};
    box-shadow: 0 0 0 2px rgba(196, 167, 231, 0.25);
  }

  &::placeholder {
    color: ${({ theme }) => theme.muted};
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.muted};
  font-size: 18px;
`;

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...'
}) => {
  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <SearchIcon>🔍</SearchIcon>
    </SearchContainer>
  );
};