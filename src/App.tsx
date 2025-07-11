import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ApiService } from './services/api';
import { CreatorsModel } from './models/creators';
import { ThemeProvider } from './theme/ThemeContext';
import { GlobalStyles } from './theme/GlobalStyles';
import { ThemeToggle } from './components/ThemeToggle';
import { CreatorList } from './components/CreatorList';
import ProfilePage from './components/ProfilePage';
import PostPage from './components/PostPage';
import type { Creator } from './types/creators';
import type { ApiInstance } from './types/common';

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

const ApiSelectorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
`;

const ApiSelector = styled.select`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.base};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.muted};
  margin-right: 1rem;
`;

const AddApiButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.pine};
  color: ${({ theme }) => theme.text};
  border: none;
  cursor: pointer;
  font-weight: 500;
`;

// Initialize API service as a singleton
const apiService = new ApiService();
const creatorsModel = new CreatorsModel();

const HomePage = () => {
  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [currentApi, setCurrentApi] = useState<ApiInstance>(apiService.getCurrentApiInstance());
  const [apiInstances, setApiInstances] = useState<ApiInstance[]>(apiService.getAvailableInstances());
  const [refreshKey, setRefreshKey] = useState<number>(0); // Added to force re-renders
  const navigate = useNavigate();

  // Function to fetch creators
  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching creators with current API instance:', apiService.getCurrentApiInstance());
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
  }, []);

  const handleApiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedApiUrl = e.target.value;
    const selectedApi = apiInstances.find(api => api.url === selectedApiUrl);

    if (selectedApi) {
      console.log('Changing API to:', selectedApi);
      apiService.setCurrentApiInstance(selectedApi);
      setCurrentApi(selectedApi);

      // Navigate to the instance-specific URL
      navigate(`/${selectedApi.url}`);
    }
  };

  const handleAddCustomApi = () => {
    const url = prompt("Enter custom API URL (e.g., custom-instance.com):");
    if (url) {
      try {
        // Add https:// if not present
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const newUrl = new URL(fullUrl);

        const apiInstance: ApiInstance = {
          name: newUrl.hostname,
          url: newUrl.hostname,
          isDefault: false
        };

        apiService.addApiInstance(apiInstance);
        setApiInstances(apiService.getAvailableInstances());

        if (confirm(`Set ${apiInstance.name} as current API?`)) {
          apiService.setCurrentApiInstance(apiInstance);
          setCurrentApi(apiInstance);

          // Navigate to the instance-specific URL
          navigate(`/${apiInstance.url}`);
        }
      } catch (err) {
        alert("Invalid URL. Please enter a valid domain.");
      }
    }
  };

  // Fetch creators when component mounts or API changes
  useEffect(() => {
    fetchCreators();
  }, [fetchCreators, refreshKey]); // Added refreshKey dependency

  return (
    <AppContainer>
      <Header>
        <Title>Coomono</Title>
        <Subtitle>An alternative frontend for kemono-style APIs</Subtitle>

        <ApiSelectorContainer>
          <ApiSelector
            value={currentApi.url}
            onChange={handleApiChange}
          >
            {apiInstances.map((api, index) => (
              <option key={index} value={api.url}>
                {api.name} ({api.url})
              </option>
            ))}
          </ApiSelector>
          <AddApiButton onClick={handleAddCustomApi}>
            Add Custom API
          </AddApiButton>
        </ApiSelectorContainer>
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
          <Route path="/:instance/*" element={<InstanceRouter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// This component handles routing for a specific instance
const InstanceRouter = () => {
  const { instance } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the instance is valid and set it as the current API instance
    if (instance) {
      const apiService = new ApiService();
      const availableInstances = apiService.getAvailableInstances();

      // Try to find the instance by URL
      const foundInstance = availableInstances.find(api => api.url === instance);

      if (foundInstance) {
        // Set this as the current instance
        console.log(`Setting instance from URL: ${foundInstance.name}`);
        apiService.setCurrentApiInstance(foundInstance);
      } else {
        // Try to add it as a new instance
        try {
          const newInstance = {
            name: instance,
            url: instance,
            isDefault: false
          };

          apiService.addApiInstance(newInstance);
          apiService.setCurrentApiInstance(newInstance);
          console.log(`Added new instance from URL: ${newInstance.name}`);
        } catch (err) {
          console.error("Invalid instance in URL:", err);
          navigate("/", { replace: true });
          return;
        }
      }
    }
  }, [instance, navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path=":service/user/:id" element={<ProfilePage />} />
      <Route path=":service/user/:id/post/:postId" element={<PostPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
