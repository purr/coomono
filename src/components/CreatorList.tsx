import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CreatorCard } from './CreatorCard';
import { SearchBar } from './SearchBar';
import type { Creator } from '../types/api';

interface CreatorListProps {
  creators: Creator[];
  isLoading: boolean;
}

type SortField = 'favorited' | 'updated' | 'name';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const Select = styled.select`
  min-width: 120px;
`;

const SortDirectionSelect = styled(Select)`
  min-width: 60px;

  & option {
    font-family: 'Arial', sans-serif;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
  gap: 8px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: ${({ theme, active }) => active ? theme.rose : theme.overlay};
  color: ${({ theme, active }) => active ? theme.base : theme.text};
  border: 1px solid ${({ theme, active }) => active ? theme.rose : theme.highlightMed};

  &:hover {
    background: ${({ theme, active }) => active ? theme.rose : theme.highlightMed};
  }
`;

// SVG icons for sort direction
const SortIcon = {
  asc: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 3.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
      <path d="M7.646 2.854a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8 3.207 6.354 4.854a.5.5 0 1 1-.708-.708l2-2z"/>
    </svg>
  ),
  desc: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 12.5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 1 0v9a.5.5 0 0 1-.5.5z"/>
      <path d="M8.354 13.146a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L8 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2z"/>
    </svg>
  )
};

export const CreatorList: React.FC<CreatorListProps> = ({ creators, isLoading }) => {
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('favorited');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const creatorsPerPage = 18;

  // Extract available services from API data
  const availableServices = React.useMemo(() => {
    const services = new Set<string>();
    creators.forEach(creator => {
      services.add(creator.service);
    });
    return Array.from(services).sort();
  }, [creators]);

  // Filter and sort creators
  useEffect(() => {
    let result = [...creators];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(creator =>
        creator.name.toLowerCase().includes(query) ||
        creator.id.toLowerCase().includes(query)
      );
    }

    // Filter by service
    if (selectedService !== 'all') {
      result = result.filter(creator => creator.service === selectedService);
    }

    // Sort by selected criterion
    result.sort((a, b) => {
      if (sortBy === 'name') {
        // Alphabetical sort for names
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (sortDirection === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      } else {
        // Numerical sort for favorites and updated
        const valueA = a[sortBy];
        const valueB = b[sortBy];

        return sortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }
    });

    setFilteredCreators(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [creators, selectedService, sortBy, sortDirection, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCreators.length / creatorsPerPage);
  const startIndex = (currentPage - 1) * creatorsPerPage;
  const displayedCreators = filteredCreators.slice(startIndex, startIndex + creatorsPerPage);

  // Generate page numbers
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // First page
      i === totalPages || // Last page
      (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current
    ) {
      pageNumbers.push(i);
    } else if (
      (i === 2 && currentPage > 3) || // Ellipsis after first page
      (i === totalPages - 1 && currentPage < totalPages - 2) // Ellipsis before last page
    ) {
      pageNumbers.push(-1); // -1 represents an ellipsis
    }
  }

  // Remove duplicates
  const uniquePageNumbers = pageNumbers.filter((num, index, arr) => {
    return arr.indexOf(num) === index;
  });

  return (
    <Container>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name or ID..."
      />

      <Header>
        <h2>Creators ({filteredCreators.length})</h2>
        <FiltersContainer>
          <Select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="all">All Services</option>
            {availableServices.map((service) => (
              <option key={service} value={service}>
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </option>
            ))}
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
          >
            <option value="favorited">Sort by Favorites</option>
            <option value="updated">Sort by Last Updated</option>
            <option value="name">Sort Alphabetically</option>
          </Select>

          <SortDirectionSelect
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
            title={sortDirection === 'desc' ? 'Descending order' : 'Ascending order'}
          >
            <option value="desc" aria-label="Descending order">
              {String.fromCharCode(8595)} {/* Down arrow */}
            </option>
            <option value="asc" aria-label="Ascending order">
              {String.fromCharCode(8593)} {/* Up arrow */}
            </option>
          </SortDirectionSelect>
        </FiltersContainer>
      </Header>

      {isLoading ? (
        <p>Loading creators...</p>
      ) : (
        <>
          <Grid>
            {displayedCreators.map((creator) => (
              <CreatorCard key={`${creator.service}-${creator.id}`} creator={creator} />
            ))}
          </Grid>

          {filteredCreators.length === 0 && (
            <div style={{ textAlign: 'center', margin: '48px 0' }}>
              <p>No creators found matching your search criteria.</p>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ←
              </PageButton>

              {uniquePageNumbers.map((pageNum, index) => (
                pageNum === -1 ? (
                  <span key={`ellipsis-${index}`} style={{ alignSelf: 'center' }}>...</span>
                ) : (
                  <PageButton
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                )
              ))}

              <PageButton
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                →
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};