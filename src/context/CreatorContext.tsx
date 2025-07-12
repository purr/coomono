import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { ApiService } from '../services/api';
import { CreatorsModel } from '../models/creators';
import type { CreatorProfile } from '../types/profile';
import type { Creator } from '../types/creators';
import { ensureCreatorsLoaded } from '../App';

interface CreatorContextProps {
  creator: CreatorProfile | null;
  isLoading: boolean;
  service?: string;
  id?: string;
  favoriteCount: number;
}

const CreatorContext = createContext<CreatorContextProps>({
  creator: null,
  isLoading: true,
  service: undefined,
  id: undefined,
  favoriteCount: 0
});

export const useCreator = () => useContext(CreatorContext);

interface CreatorProviderProps {
  children: ReactNode;
  creatorsModel: CreatorsModel;
}

export const CreatorProvider: React.FC<CreatorProviderProps> = ({ children, creatorsModel }) => {
  const { service, id } = useParams<{ service?: string; id?: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const apiService = new ApiService();

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!service || !id) {
        setCreator(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Ensure creators data is loaded
        await ensureCreatorsLoaded();

        // Find the creator in our model
        const cachedCreator = creatorsModel.findCreator(service, id);
        if (cachedCreator) {
          setFavoriteCount(cachedCreator.favorited);
        }

        // Fetch the full creator profile
        const response = await apiService.getCreatorProfile(service, id);
        if (response.data) {
          setCreator(response.data);

          // If we didn't have the favorite count from cache, use the one from the profile
          if (!cachedCreator) {
            setFavoriteCount(response.data.favorited);
          }
        }
      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [service, id]);

  return (
    <CreatorContext.Provider value={{
      creator,
      isLoading,
      service,
      id,
      favoriteCount
    }}>
      {children}
    </CreatorContext.Provider>
  );
};

export default CreatorContext;