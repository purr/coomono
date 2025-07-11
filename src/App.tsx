import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { ApiService } from './services/api';
import { CreatorsModel } from './models/creators';
import { ThemeProvider } from './theme/ThemeContext';
import { GlobalStyles } from './theme/GlobalStyles';
import { ThemeToggle } from './components/ThemeToggle';
import { CreatorList } from './components/CreatorList';
import ProfilePage from './components/ProfilePage';
import PostPage from './components/PostPage';
import type { Creator } from './types/api';

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 2rem 0;
`;

const Header = styled.header`
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.subtle};
  margin-bottom: 2rem;
`;

const Main = styled.main`
  padding-bottom: 3rem;
`;

const ErrorContainer = styled.div`
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  background: rgba(235, 111, 146, 0.1);
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.love};
`;

const HomePage = () => {
  // Initialize API service and creators model
  const apiService = new ApiService();
  const creatorsModel = new CreatorsModel();

  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);

  // Fetch creators when component mounts
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllCreators();

        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          // Process the data and store in model
          const creatorData = response.data;
          creatorsModel.setCreators(creatorData);
          setCreators(creatorData);

          // Log available data for debugging and future feature development
          if (creatorData.length > 0) {
            console.log('Sample creator data structure:', creatorData[0]);
          }
        }
      } catch (err) {
        setError('Failed to fetch creators');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  return (
    <AppContainer>
      <Header>
        <Title>Coomono</Title>
        <Subtitle>An alternative frontend for coomer.su and kemono.su</Subtitle>
      </Header>
      <Main>
        {error ? (
          <ErrorContainer>
            <ErrorText>Error: {error}</ErrorText>
          </ErrorContainer>
        ) : (
          <CreatorList creators={creators} isLoading={loading} />
        )}
      </Main>
    </AppContainer>
  );
};

// Main App component with routing
function App() {
  // Get the base path for the app (useful for GitHub Pages deployment)
  const basePath = import.meta.env.BASE_URL || '/';

  return (
    <ThemeProvider>
      <GlobalStyles />
      <ThemeToggle />
      <BrowserRouter basename={basePath}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:service/:id" element={<ProfilePage />} />
          <Route path="/post/:service/:id/:postId" element={<PostPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
