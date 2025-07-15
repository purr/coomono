import { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  Outlet,
} from "react-router-dom";
import styled from "styled-components";
import { ApiService } from "./services/api";
import { CreatorsModel } from "./models/creators";
import { ThemeProvider } from "./theme/ThemeContext";
import { GlobalStyles } from "./theme/GlobalStyles";
import { ThemeToggle } from "./components/ThemeToggle";
import { CreatorList } from "./components/CreatorList";
import ProfilePage from "./components/ProfilePage";
import PostPage from "./components/PostPage";
import BreadcrumbNavigation from "./components/BreadcrumbNavigation";
import CreatorHeader from "./components/CreatorHeader";
import LoadingBar from "./components/LoadingBar";
import { NavigationProvider, useNavigation } from "./context/NavigationContext";
import { CreatorProvider } from "./context/CreatorContext";
import type { Creator } from "./types/creators";
import type { ApiInstance } from "./types/common";

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 2rem 0;
`;

const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
`;

const CreatorLayoutContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
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

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.pine};
  color: ${({ theme }) => theme.text};
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-right: 1rem;
`;

const AddApiButton = styled(Button)``;
const RefreshButton = styled(Button)``;

// Initialize API service as a singleton
const apiService = new ApiService();
const creatorsModel = new CreatorsModel();

// Global function to ensure creators are loaded - can be called from any component
export const ensureCreatorsLoaded = async (): Promise<boolean> => {
  if (creatorsModel.getCreators().length > 0 && creatorsModel.getCurrentDomain() === apiService.getDomain()) {
    console.log("Using existing creators data from model");
    return true;
  }

  try {
    console.log("Fetching creators.txt to populate model");
    // Clear existing creators when loading for a new domain
    creatorsModel.setCreators([]);

    const response = await apiService.getAllCreators();
    if (response.data) {
      creatorsModel.setCreators(response.data);
      // Store the current domain for future reference
      creatorsModel.setCurrentDomain(apiService.getDomain());
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to fetch creators", err);
    return false;
  }
};

const HomePage = () => {
  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [currentApi, setCurrentApi] = useState<ApiInstance>(
    apiService.getCurrentApiInstance()
  );
  const [apiInstances, setApiInstances] = useState<ApiInstance[]>(
    apiService.getAvailableInstances()
  );
  const [refreshKey, setRefreshKey] = useState<number>(0); // Used only for manual refresh
  const navigate = useNavigate();
  const { instance } = useParams<{ instance?: string }>();

  // Function to fetch creators
  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the common function to ensure creators are loaded
      await ensureCreatorsLoaded();

      // Get the creators from the model (which was just populated if needed)
      const creatorData = creatorsModel.getCreators();
      setCreators(creatorData);

      // Log available data for debugging and future feature development
      if (creatorData.length > 0) {
        console.log("Sample creator data structure:", creatorData[0]);
      }
    } catch (err) {
      setError("Failed to fetch creators");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update current API if instance param changes
  useEffect(() => {
    if (instance && instance !== currentApi.url) {
      const matchingInstance = apiInstances.find((api) => api.url === instance);
      if (matchingInstance) {
        console.log(
          "Instance changed in URL, updating API instance:",
          matchingInstance
        );
        apiService.setCurrentApiInstance(matchingInstance);
        setCurrentApi(matchingInstance);

        // Load creators for the new instance
        fetchCreators();
      }
    }
  }, [instance, apiInstances, currentApi.url, fetchCreators]);

  const handleApiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedApiUrl = e.target.value;
    const selectedApi = apiInstances.find((api) => api.url === selectedApiUrl);

    if (selectedApi) {
      console.log("Changing API to:", selectedApi);

      // Clear creators in the model before changing API instance
      creatorsModel.setCreators([]);

      apiService.setCurrentApiInstance(selectedApi);
      setCurrentApi(selectedApi);

      // Navigate to the instance-specific URL
      navigate(`/${selectedApi.url}`);

      // The fetchCreators will be called from the effect above
      // when instance changes, so we don't need to call it here
    }
  };

  const handleAddCustomApi = () => {
    const url = prompt("Enter custom API URL (e.g., custom-instance.com):");
    if (url) {
      try {
        // Add https:// if not present
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        const newUrl = new URL(fullUrl);

        const apiInstance: ApiInstance = {
          name: newUrl.hostname,
          url: newUrl.hostname,
          isDefault: false,
        };

        apiService.addApiInstance(apiInstance);
        setApiInstances(apiService.getAvailableInstances());

        if (confirm(`Set ${apiInstance.name} as current API?`)) {
          // Clear creators in the model before changing API instance
          creatorsModel.setCreators([]);

          apiService.setCurrentApiInstance(apiInstance);
          setCurrentApi(apiInstance);

          // Navigate to the instance-specific URL
          navigate(`/${apiInstance.url}`);

          // The fetchCreators will be called from the effect above
          // when instance changes, so we don't need to call it here
        }
      } catch (err) {
        alert("Invalid URL. Please enter a valid domain.");
      }
    }
  };

  const handleRefresh = () => {
    // Clear cache for current domain
    apiService.clearCreatorsCache();

    // Force a refresh by triggering the fetchCreators function
    fetchCreators();
  };

  // Fetch creators on initial mount only
  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]); // Only depend on fetchCreators, which doesn't change

  return (
    <HomeContainer>
      <BreadcrumbNavigation />
      <Header>
        <Title>Coomono</Title>
        <Subtitle>An alternative frontend for kemono-style APIs</Subtitle>

        <ApiSelectorContainer>
          <ApiSelector value={currentApi.url} onChange={handleApiChange}>
            {apiInstances.map((api, index) => (
              <option key={index} value={api.url}>
                {api.name} ({api.url})
              </option>
            ))}
          </ApiSelector>
          <RefreshButton onClick={handleRefresh}>Refresh</RefreshButton>
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
    </HomeContainer>
  );
};

// Main App component with routing
function App() {
  // Get the base path for the app (useful for GitHub Pages deployment)
  const basePath = import.meta.env.BASE_URL || "/";

  return (
    <ThemeProvider>
      <GlobalStyles />
      <ThemeToggle />
      <BrowserRouter basename={basePath}>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Separate component to use the navigation context
const AppContent = () => {
  const { isNavigating } = useNavigation();

  return (
    <>
      <LoadingBar isLoading={isNavigating} />
      <Routes>
        <Route path="/" element={<Navigate to="/coomer.su" replace />} />
        <Route path="/:instance/*" element={<InstanceRouter />} />
        <Route path="*" element={<Navigate to="/coomer.su" replace />} />
      </Routes>
    </>
  );
};

// This component handles routing for a specific instance
const InstanceRouter = () => {
  const { instance } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    const handleInstanceSelection = async () => {
      // Use the existing singleton instance
      const availableInstances = apiService.getAvailableInstances();
      const defaultInstance = availableInstances.find(
        (api) => api.url === "coomer.su"
      );

      // If no instance specified, redirect to default
      if (!instance) {
        if (defaultInstance) {
          apiService.setCurrentApiInstance(defaultInstance);
          navigate(`/${defaultInstance.url}`, { replace: true });
        }
        return;
      }

      // Try to find the instance by URL
      const foundInstance = availableInstances.find(
        (api) => api.url === instance
      );

      if (foundInstance) {
        // Set this as the current instance
        console.log(`Setting instance from URL: ${foundInstance.name}`);
        apiService.setCurrentApiInstance(foundInstance);
        setError(null);

        // Ensure creators are loaded on instance change
        await ensureCreatorsLoaded();
      } else {
        // Try to add it as a new instance and validate it
        try {
          const newInstance = {
            name: instance,
            url: instance,
            isDefault: false,
          };

          // Add the new instance
          apiService.addApiInstance(newInstance);

          // Validate the instance
          const validationResult = await apiService.validateApiInstance(
            newInstance
          );

          if (validationResult.isValid) {
            // Instance is valid, set it as current
            apiService.setCurrentApiInstance(newInstance);
            console.log(
              `Added and validated new instance from URL: ${newInstance.name}`
            );
            setError(null);

            // Ensure creators are loaded for the new instance
            await ensureCreatorsLoaded();
          } else {
            // Instance is invalid, show error and fallback to default
            console.error(
              `Invalid instance ${instance}:`,
              validationResult.error
            );
            setError(
              `The instance "${instance}" appears to be invalid. Falling back to default.`
            );

            // Fallback to default instance (coomer.su)
            if (defaultInstance) {
              apiService.setCurrentApiInstance(defaultInstance);
              // Update URL without triggering a new navigation
              window.history.replaceState(null, "", `/${defaultInstance.url}`);

              // Ensure creators are loaded for the default instance
              await ensureCreatorsLoaded();
            }
          }
        } catch (err) {
          console.error("Invalid instance in URL:", err);
          setError(
            `The instance "${instance}" appears to be invalid. Falling back to default.`
          );

          // Fallback to default instance (coomer.su)
          if (defaultInstance) {
            apiService.setCurrentApiInstance(defaultInstance);
            // Update URL without triggering a new navigation
            window.history.replaceState(null, "", `/${defaultInstance.url}`);

            // Ensure creators are loaded for the default instance
            await ensureCreatorsLoaded();
          } else {
            navigate("/", { replace: true });
          }
        }
      }
    };

    handleInstanceSelection();
  }, [instance, navigate]);

  // Create a layout component for creator pages
  const CreatorLayout = () => {
    // Pre-load creators to ensure they're available for CreatorProvider
    useEffect(() => {
      ensureCreatorsLoaded();
    }, []);

    return (
      <CreatorLayoutContainer>
        <CreatorProvider creatorsModel={creatorsModel}>
          <BreadcrumbNavigation />
          <CreatorHeader />
          <Outlet />
        </CreatorProvider>
      </CreatorLayoutContainer>
    );
  };

  return (
    <>
      {error && (
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
        </ErrorContainer>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<CreatorLayout />}>
          <Route path=":service/user/:id" element={<ProfilePage />} />
          <Route path=":service/user/:id/post/:postId" element={<PostPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
