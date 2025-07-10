import { useEffect, useState, useContext } from "react";
import styled from "styled-components";
import { ApiService } from "./services/api";
import { CreatorsModel } from "./models/creators";
import { ThemeProvider, ThemeContext } from "./theme/ThemeContext";
import { GlobalStyles } from "./theme/GlobalStyles";
import { ThemeToggle } from "./components/ThemeToggle";
import { CreatorList } from "./components/CreatorList";
import type { Creator } from "./types/api";

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

const AppContent = () => {
  // Initialize API service and creators model
  const apiService = new ApiService();
  const creatorsModel = new CreatorsModel();
  const { theme } = useContext(ThemeContext);

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
            console.log("Sample creator data structure:", creatorData[0]);
          }
        }
      } catch (err) {
        setError("Failed to fetch creators");
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
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto",
              background: "rgba(235, 111, 146, 0.1)",
              color: theme.love,
            }}
          >
            Error: {error}
          </div>
        ) : (
          <CreatorList creators={creators} isLoading={loading} />
        )}
      </Main>
    </AppContainer>
  );
};

function App() {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <ThemeToggle />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
