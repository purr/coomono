import React, { memo } from 'react';
import styled from 'styled-components';
import { ApiService } from '../services/api';
import { useCreator } from '../context/CreatorContext';
import type { Link } from '../types/creators';

// Styled components
const ProfileHeaderContainer = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
`;

const BannerImage = styled.div<{ imageUrl?: string }>`
  width: 100%;
  height: 240px;
  background-image: url(${props => props.imageUrl || 'none'});
  background-size: cover;
  background-position: center;
  position: relative;

  /* Ensure image is always displayed at full size */
  background-repeat: no-repeat;
  min-height: 240px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  }
`;

const ProfileInfo = styled.div`
  position: relative;
  margin-top: -80px;
  padding: 0 24px;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
    gap: 24px;
  }
`;

const ProfilePicture = styled.div<{ imageUrl?: string }>`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.rose};
  background-image: url(${props => props.imageUrl || 'none'});
  background-size: cover;
  background-position: center;
  margin-bottom: 16px;
  z-index: 2;
`;

const ProfileDetails = styled.div`
  flex: 1;
`;

const CreatorName = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  margin-bottom: 8px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.subtle};
`;

const LinkedAccounts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.highlightMed};
  }
`;

// Function to determine if two objects have the same service and ID
const arePropsEqual = (prevProps: {}, nextProps: {}) => {
  return true; // Always reuse component instance as we get data from context
};

const CreatorHeader: React.FC = () => {
  const { creator, service, id, favoriteCount } = useCreator();
  const apiService = new ApiService();

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Create a safe creator object that always has the required properties
  const safeCreator = creator || {
    id: id || '',
    name: id || '',
    service: service || '',
    favorited: favoriteCount,
    updated: Math.floor(Date.now() / 1000),
    links: []
  };

  return (
    <ProfileHeaderContainer>
      <BannerImage imageUrl={apiService.getBannerUrl(service!, id!)} />
      <ProfileInfo>
        <ProfilePicture imageUrl={apiService.getProfilePictureUrl(service!, id!)} />
        <ProfileDetails>
          <CreatorName>{safeCreator.name || id}</CreatorName>
          <StatsRow>
            <Stat>
              <span>Service:</span>
              <strong>{service}</strong>
            </Stat>
            <Stat>
              <span>❤️</span>
              <strong>{favoriteCount ? favoriteCount.toLocaleString() : '0'}</strong>
            </Stat>
            <Stat>
              <span>Last Updated:</span>
              <strong>{safeCreator.updated ? formatTimestamp(safeCreator.updated) : 'Unknown'}</strong>
            </Stat>
          </StatsRow>

          {safeCreator.links && safeCreator.links.length > 0 && (
            <LinkedAccounts>
              {safeCreator.links.map((link: Link, index: number) => (
                <SocialLink key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.platform === 'twitter' && '𝕏 Twitter'}
                  {link.platform === 'instagram' && '📷 Instagram'}
                  {link.platform === 'youtube' && '▶️ YouTube'}
                  {link.platform === 'twitch' && '🎮 Twitch'}
                  {!['twitter', 'instagram', 'youtube', 'twitch'].includes(link.platform) && `🔗 ${link.platform}`}
                </SocialLink>
              ))}
            </LinkedAccounts>
          )}
        </ProfileDetails>
      </ProfileInfo>
    </ProfileHeaderContainer>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(CreatorHeader, arePropsEqual);