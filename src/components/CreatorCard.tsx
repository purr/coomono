import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import type { Creator } from '../types/api';
import { ApiService } from '../services/api';

interface CreatorCardProps {
  creator: Creator;
}

const Card = styled(Link)`
  position: relative;
  width: 100%;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.surface};
  transition: transform 0.3s ease;
  cursor: pointer;
  aspect-ratio: 4.5 / 1; /* Approximately 720:160 */
  display: block;
  text-decoration: none;

  &:hover {
    transform: translateY(-4px);
    text-decoration: none;
  }

  &:focus {
    outline: none;
    text-decoration: none;
  }
`;

const BannerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
`;

const Banner = styled.div<{ imageUrl?: string }>`
  width: 100%;
  height: 100%;
  background-image: url(${props => props.imageUrl || 'none'});
  background-size: cover;
  background-position: center;
  filter: brightness(0.5);
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
  z-index: 1;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  padding: 10px;
  height: 100%;
  display: flex;
  align-items: center;
`;

const ProfileAndInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const ProfilePicture = styled.div<{ imageUrl?: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-image: url(${props => props.imageUrl || 'none'});
  background-size: cover;
  background-position: center;
  border: 2px solid ${({ theme }) => theme.rose};
  flex-shrink: 0;
`;

const TextContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CreatorName = styled.h3`
  color: ${({ theme }) => theme.text};
  font-size: 1.25rem;
  margin: 0;
  margin-bottom: 4px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.subtle};
  font-size: 0.85rem;
`;

const FavoritesCount = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.subtle};
  font-size: 0.85rem;
`;

const ServiceTag = styled.span`
  color: ${({ theme }) => theme.subtle};
  font-size: 0.85rem;
`;

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const apiService = new ApiService();
  const bannerUrl = apiService.getBannerUrl(creator.service, creator.id);
  const profileUrl = apiService.getProfilePictureUrl(creator.service, creator.id);

  const formattedFavorites = creator.favorited.toLocaleString();

  return (
    <Card to={`/profile/${creator.service}/${creator.id}`}>
      <BannerContainer>
        <Banner imageUrl={bannerUrl} />
      </BannerContainer>
      <Overlay />
      <Content>
        <ProfileAndInfo>
          <ProfilePicture imageUrl={profileUrl} />
          <TextContent>
            <CreatorName>{creator.name}</CreatorName>
            <MetaInfo>
              <FavoritesCount>❤️ {formattedFavorites}</FavoritesCount>
              <ServiceTag>{creator.service}</ServiceTag>
            </MetaInfo>
          </TextContent>
        </ProfileAndInfo>
      </Content>
    </Card>
  );
};