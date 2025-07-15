import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { Creator } from '../types/creators';
import { ApiService } from '../services/api';
import { handleLinkInteraction } from '../utils/helpers';
import { useNavigation } from '../context/NavigationContext';

interface CreatorCardProps {
  creator: Creator;
}

const Card = styled.a`
  position: relative;
  width: 100%;
  /* Remove fixed min-width to prevent overflow */
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.surface};
  transition: transform 0.3s ease;
  cursor: pointer;
  aspect-ratio: 4.5 / 1; /* Approximately 720:160 */
  display: block;
  text-decoration: none;
  color: inherit; /* Inherit text color */
  box-sizing: border-box; /* Include padding and border in width calculation */

  &:hover {
    transform: translateY(-4px);
    text-decoration: none;
  }

  &:focus {
    outline: none;
    text-decoration: none;
  }

  &:visited {
    color: inherit;
    text-decoration: none;
  }

  @media (max-width: 480px) {
    /* On mobile, maintain same height but ensure full width fits */
    width: 100%;
    min-width: unset;
  }
`;

const BannerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  min-height: 80px; /* Ensure minimum height */
  overflow: hidden; /* Prevent banner from overflowing container */
`;

const Banner = styled.div<{ imageUrl?: string }>`
  width: 100%;
  height: 100%;
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  filter: brightness(0.5);
  min-width: 100%; /* Ensure banner covers the entire width */
  min-height: 80px; /* Ensure minimum height */
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
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
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
  const navigate = useNavigate();
  const { startNavigation } = useNavigation();
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const currentInstance = apiService.getCurrentApiInstance();
  const formattedFavorites = creator.favorited.toLocaleString();

  // Only load image URLs once when the component mounts
  useEffect(() => {
    // Use a flag to prevent setting state if component unmounts before API call completes
    let isMounted = true;

    if (isMounted) {
      setBannerUrl(apiService.getBannerUrl(creator.service, creator.id));
      setProfileUrl(apiService.getProfilePictureUrl(creator.service, creator.id));
    }

    return () => {
      isMounted = false; // Clean up to prevent memory leaks
    };
  }, [creator.service, creator.id]);

  const linkUrl = `/${currentInstance.url}/${creator.service}/user/${creator.id}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startNavigation();
    navigate(linkUrl);
  };

  const linkProps = handleLinkInteraction(linkUrl, handleClick, startNavigation);

  return (
    <Card
      href={linkUrl}
      {...linkProps}
    >
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