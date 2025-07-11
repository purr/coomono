import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ApiService } from '../services/api';
import type { Creator, Post as ApiPost, File } from '../types/api';

// Make sure the Post type has all fields as optional
interface Post extends Omit<ApiPost, 'published' | 'added' | 'edited'> {
  published?: string;
  added?: string;
  edited?: string | null;
}

// Styled components
const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
`;

const BackButton = styled.button`
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.highlightMed};
  }
`;

const ProfileHeader = styled.div`
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

const TabsContainer = styled.div`
  display: flex;
  justify-content: center; /* Center the tabs */
  border-bottom: 1px solid ${({ theme }) => theme.highlightMed};
  margin-bottom: 24px;
  margin-top: 32px;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 12px 24px;
  background: none;
  border: none;
  color: ${({ theme, active }) => active ? theme.text : theme.subtle};
  font-size: 1.1rem;
  font-weight: ${({ active }) => active ? '600' : '400'};
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${({ theme, active }) => active ? theme.rose : 'transparent'};
  }

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.highlightMed};
`;

const SortDirectionSelect = styled(Select)`
  min-width: 60px;

  & option {
    font-family: 'Arial', sans-serif;
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

// Posts section
const PostsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PostCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    transition: transform 0.3s ease;
  }
`;

const PostHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.highlightLow};
  display: flex;
  justify-content: space-between;
`;

const PostTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const PostDate = styled.span`
  color: ${({ theme }) => theme.subtle};
  font-size: 0.9rem;
`;

const PostContent = styled.div<{ expanded: boolean }>`
  padding: 16px;
  max-height: ${props => props.expanded ? 'none' : '200px'};
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: ${props => props.expanded ? '0' : '80px'};
    background: ${props => props.expanded ? 'none' : 'linear-gradient(to top, var(--surface), transparent)'};
    pointer-events: none;
  }
`;

const ExpandButton = styled.button`
  background: ${({ theme }) => theme.overlay};
  color: ${({ theme }) => theme.text};
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin: 0 16px 16px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.highlightMed};
  }
`;

const PostMedia = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 16px;
`;

const MediaThumbnail = styled.div<{ imageUrl?: string }>`
  width: 120px;
  height: 120px;
  border-radius: 4px;
  background-image: url(${props => props.imageUrl || 'none'});
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;

  &:hover {
    opacity: 0.9;
  }
`;

const VideoIndicator = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
`;

// Media Grid
const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const MediaCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    transition: transform 0.3s ease;
  }
`;

const MediaPreview = styled.div<{ imageUrl?: string }>`
  width: 100%;
  height: 180px;
  background-image: url(${props => props.imageUrl || 'none'});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const MediaInfo = styled.div`
  padding: 12px;
`;

const MediaTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MediaMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${({ theme }) => theme.subtle};
  font-size: 0.85rem;
  margin-top: 4px;
`;

// Media Viewer
const MediaViewerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const MediaViewerContent = styled.div`
  max-width: 90%;
  max-height: 80%;
  position: relative;
`;

const MediaViewerControls = styled.div`
  position: absolute;
  bottom: -60px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const MediaViewerButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const VideoPlayer = styled.video`
  max-width: 100%;
  max-height: 80vh;
`;

const ImageViewer = styled.img`
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
`;

interface ExpandedPostState {
  [key: string]: boolean;
}

type PostSortField = 'published' | 'title';
type MediaSortField = 'added' | 'size' | 'duration';

const ProfilePage: React.FC = () => {
  const { service, id } = useParams<{ service: string; id: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');
  const [expandedPosts, setExpandedPosts] = useState<ExpandedPostState>({});

  // Post sorting and pagination states
  const [postSortBy, setPostSortBy] = useState<PostSortField>('published');
  const [postSortDirection, setPostSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPostPage, setCurrentPostPage] = useState(1);
  const postsPerPage = 10;

  // Media filtering, sorting and pagination states
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [mediaSortBy, setMediaSortBy] = useState<MediaSortField>('added');
  const [mediaSortDirection, setMediaSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentMediaPage, setCurrentMediaPage] = useState(1);
  const mediaPerPage = 10;

  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);

  const apiService = new ApiService();

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!service || !id) return;

      setLoading(true);
      try {
        // Fetch creator details
        const creatorResponse = await apiService.getCreator(service, id);
        if (creatorResponse.data) {
          setCreator(creatorResponse.data);
        }

        // Fetch creator posts
        const postsResponse = await apiService.getCreatorPosts(service, id);
        if (postsResponse.data) {
          setPosts(postsResponse.data as Post[]);

          // Extract all media files from posts
          const allMedia: File[] = [];
          postsResponse.data.forEach(post => {
            // Get timestamp from post published date or use current time
            const currentTime = Math.floor(Date.now() / 1000);
            let timestamp = currentTime;

            if (post.published && typeof post.published === 'string') {
              try {
                const date = new Date(post.published);
                if (!isNaN(date.getTime())) {
                  timestamp = Math.floor(date.getTime() / 1000);
                }
              } catch (e) {
                console.error('Error parsing date:', e);
              }
            }

            // Add main file if exists
            if (post.file) {
              const fileWithId: File = {
                ...post.file,
                id: `${post.id}-main`,
                added: timestamp
              };
              allMedia.push(fileWithId);
            }

            // Add attachments if exist
            if (post.attachments && post.attachments.length > 0) {
              post.attachments.forEach((attachment, index) => {
                const attachmentWithId: File = {
                  ...attachment,
                  id: `${post.id}-attachment-${index}`,
                  added: timestamp
                };
                allMedia.push(attachmentWithId);
              });
            }
          });

          setMedia(allMedia);
        }
      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [service, id]);

  const toggleExpandPost = (postId: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleMediaClick = (file: File, index: number) => {
    setSelectedMedia(file);
    setCurrentMediaIndex(index);
  };

  const closeMediaViewer = () => {
    setSelectedMedia(null);
    setCurrentMediaIndex(-1);
  };

  const navigateMedia = (direction: 'next' | 'prev') => {
    if (currentMediaIndex === -1) return;

    const filteredMediaList = getFilteredMedia(); // Use a local variable to avoid re-calculating
    const newIndex = direction === 'next'
      ? (currentMediaIndex + 1) % filteredMediaList.length
      : (currentMediaIndex - 1 + filteredMediaList.length) % filteredMediaList.length;

    setSelectedMedia(filteredMediaList[newIndex]);
    setCurrentMediaIndex(newIndex);
  };

  const skipVideo = (seconds: number) => {
    const videoElement = document.getElementById('media-viewer-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime += seconds;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get sorted and paginated posts
  const getSortedAndPaginatedPosts = () => {
    let sortedPosts = [...posts];

    sortedPosts.sort((a, b) => {
      if (postSortBy === 'title') {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        return postSortDirection === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      } else { // published date
        const getDate = (dateStr: string | undefined) => {
          if (!dateStr) return 0;
          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          } catch (e) {
            return 0;
          }
        };

        const dateA = getDate(a.published);
        const dateB = getDate(b.published);
        return postSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    const startIndex = (currentPostPage - 1) * postsPerPage;
    return sortedPosts.slice(startIndex, startIndex + postsPerPage);
  };

  const displayedPosts = getSortedAndPaginatedPosts();
  const totalPostPages = Math.ceil(posts.length / postsPerPage);
  const postPageNumbers: number[] = [];
  for (let i = 1; i <= totalPostPages; i++) {
    if (
      i === 1 || // First page
      i === totalPostPages || // Last page
      (i >= currentPostPage - 1 && i <= currentPostPage + 1) // Pages around current
    ) {
      postPageNumbers.push(i);
    } else if (
      (i === 2 && currentPostPage > 3) || // Ellipsis after first page
      (i === totalPostPages - 1 && currentPostPage < totalPostPages - 2) // Ellipsis before last page
    ) {
      postPageNumbers.push(-1); // -1 represents an ellipsis
    }
  }
  const uniquePostPageNumbers = postPageNumbers.filter((num, index, arr) => arr.indexOf(num) === index);

  const getFilteredMedia = () => {
    let filteredMediaList = [...media];

    // Apply media type filter
    if (mediaFilter === 'images') {
      filteredMediaList = filteredMediaList.filter(file =>
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
    } else if (mediaFilter === 'videos') {
      filteredMediaList = filteredMediaList.filter(file =>
        file.name.match(/\.(mp4|webm|mov|avi|wmv)$/i)
      );
    }

    // Apply sorting
    filteredMediaList.sort((a, b) => {
      if (mediaSortBy === 'added') {
        const aAdded = a.added || 0;
        const bAdded = b.added || 0;
        return mediaSortDirection === 'asc' ? aAdded - bAdded : bAdded - aAdded;
      } else if (mediaSortBy === 'size') {
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        return mediaSortDirection === 'asc' ? aSize - bSize : bSize - aSize;
      } else { // duration
        const aDuration = a.duration || 0;
        const bDuration = b.duration || 0;
        return mediaSortDirection === 'asc' ? aDuration - bDuration : bDuration - aDuration;
      }
    });

    return filteredMediaList;
  };

  const paginatedMedia = () => {
    const filtered = getFilteredMedia();
    const startIndex = (currentMediaPage - 1) * mediaPerPage;
    return filtered.slice(startIndex, startIndex + mediaPerPage);
  };

  const displayedMedia = paginatedMedia();
  const totalMediaPages = Math.ceil(getFilteredMedia().length / mediaPerPage);
  const mediaPageNumbers: number[] = [];
  for (let i = 1; i <= totalMediaPages; i++) {
    if (
      i === 1 || // First page
      i === totalMediaPages || // Last page
      (i >= currentMediaPage - 1 && i <= currentMediaPage + 1) // Pages around current
    ) {
      mediaPageNumbers.push(i);
    } else if (
      (i === 2 && currentMediaPage > 3) || // Ellipsis after first page
      (i === totalMediaPages - 1 && currentMediaPage < totalMediaPages - 2) // Ellipsis before last page
    ) {
      mediaPageNumbers.push(-1); // -1 represents an ellipsis
    }
  }
  const uniqueMediaPageNumbers = mediaPageNumbers.filter((num, index, arr) => arr.indexOf(num) === index);

  const isVideo = (file: File) => {
    return file.name.match(/\.(mp4|webm|mov|avi|wmv)$/i) !== null;
  };

  const getMediaUrl = (file: File) => {
    return apiService.getFileUrl(file.path);
  };

  const getThumbnailUrl = (file: File) => {
    if (isVideo(file) && file.path) {
      // For videos, we might have a thumbnail
      return apiService.getThumbnailUrl(file.path);
    }
    // For images, use the image itself
    return getMediaUrl(file);
  };

  // Get all media files for a post (main file + attachments)
  const getPostMediaFiles = (post: Post): File[] => {
    const files: File[] = [];

    // Get timestamp for file
    const currentTime = Math.floor(Date.now() / 1000);
    let timestamp = currentTime;

    if (post.published && typeof post.published === 'string') {
      try {
        const date = new Date(post.published);
        if (!isNaN(date.getTime())) {
          timestamp = Math.floor(date.getTime() / 1000);
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }

    // Add main file if exists
    if (post.file) {
      files.push({
        id: `${post.id}-main`,
        name: post.file.name,
        path: post.file.path,
        added: timestamp
      });
    }

    // Add attachments if exist
    if (post.attachments && post.attachments.length > 0) {
      post.attachments.forEach((attachment, index) => {
        files.push({
          id: `${post.id}-attachment-${index}`,
          name: attachment.name,
          path: attachment.path,
          added: timestamp
        });
      });
    }

    return files;
  };

  // Navigate to full post view
  const navigateToPost = (post: Post) => {
    navigate(`/post/${service}/${id}/${post.id}`);
  };

  if (loading) {
    return (
      <ProfileContainer>
        <p>Loading creator profile...</p>
      </ProfileContainer>
    );
  }

  if (!creator) {
    return (
      <ProfileContainer>
        <p>Creator not found</p>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <BackButton onClick={() => navigate(-1)}>
        ← Back to Creators
      </BackButton>

      <ProfileHeader>
        <BannerImage imageUrl={apiService.getBannerUrl(service!, id!)} />
        <ProfileInfo>
          <ProfilePicture imageUrl={apiService.getProfilePictureUrl(service!, id!)} />
          <ProfileDetails>
            <CreatorName>{creator.name}</CreatorName>
            <StatsRow>
              <Stat>
                <span>Service:</span>
                <strong>{service}</strong>
              </Stat>
              <Stat>
                <span>❤️</span>
                <strong>{creator.favorited.toLocaleString()}</strong>
              </Stat>
              <Stat>
                <span>Last Updated:</span>
                <strong>{formatTimestamp(creator.updated)}</strong>
              </Stat>
            </StatsRow>

            {creator.links && creator.links.length > 0 && (
              <LinkedAccounts>
                {creator.links.map((link, index) => (
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
      </ProfileHeader>

      <TabsContainer>
        <Tab
          active={activeTab === 'posts'}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </Tab>
        <Tab
          active={activeTab === 'media'}
          onClick={() => setActiveTab('media')}
        >
          Media
        </Tab>
      </TabsContainer>

      {activeTab === 'posts' && (
        <>
          <FiltersContainer>
            <FilterGroup>
              <Select
                value={postSortBy}
                onChange={(e) => setPostSortBy(e.target.value as PostSortField)}
              >
                <option value="published">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </Select>

              <SortDirectionSelect
                value={postSortDirection}
                onChange={(e) => setPostSortDirection(e.target.value as 'asc' | 'desc')}
                title={postSortDirection === 'desc' ? 'Descending order' : 'Ascending order'}
              >
                <option value="desc" aria-label="Descending order">
                  {String.fromCharCode(8595)} {/* Down arrow */}
                </option>
                <option value="asc" aria-label="Ascending order">
                  {String.fromCharCode(8593)} {/* Up arrow */}
                </option>
              </SortDirectionSelect>
            </FilterGroup>

            <div>
              {posts.length} posts
            </div>
          </FiltersContainer>
          <PostsContainer>
            {displayedPosts.length === 0 ? (
              <p>No posts found for this creator.</p>
            ) : (
              displayedPosts.map(post => {
                const postFiles = getPostMediaFiles(post);
                return (
                  <PostCard key={post.id} onClick={() => navigateToPost(post)}>
                    <PostHeader>
                      <PostTitle>{post.title || `Post from ${formatDate(post.published)}`}</PostTitle>
                      <PostDate>{formatDate(post.published)}</PostDate>
                    </PostHeader>

                    {post.content && (
                      <>
                        <PostContent expanded={!!expandedPosts[post.id]}>
                          <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        </PostContent>
                        {post.content.length > 300 && (
                          <ExpandButton onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating to post view
                            toggleExpandPost(post.id);
                          }}>
                            {expandedPosts[post.id] ? 'Show Less' : 'Show More'}
                          </ExpandButton>
                        )}
                      </>
                    )}

                    {postFiles.length > 0 && (
                      <PostMedia>
                        {postFiles.slice(0, 6).map((file) => (
                          <MediaThumbnail
                            key={file.id}
                            imageUrl={getThumbnailUrl(file)}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigating to post view
                              handleMediaClick(file, media.findIndex(m => m.id === file.id));
                            }}
                          >
                            {isVideo(file) && (
                              <VideoIndicator>
                                {file.duration ? formatDuration(file.duration) : 'Video'}
                              </VideoIndicator>
                            )}
                          </MediaThumbnail>
                        ))}
                        {postFiles.length > 6 && (
                          <MediaThumbnail>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '100%',
                              background: 'rgba(0,0,0,0.7)'
                            }}>
                              +{postFiles.length - 6} more
                            </div>
                          </MediaThumbnail>
                        )}
                      </PostMedia>
                    )}
                  </PostCard>
                );
              })
            )}
          </PostsContainer>

          {totalPostPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setCurrentPostPage(prev => Math.max(1, prev - 1))}
                disabled={currentPostPage === 1}
              >
                ←
              </PageButton>

              {uniquePostPageNumbers.map((pageNum, index) => (
                pageNum === -1 ? (
                  <span key={`ellipsis-post-${index}`} style={{ alignSelf: 'center' }}>...</span>
                ) : (
                  <PageButton
                    key={`post-page-${pageNum}`}
                    active={pageNum === currentPostPage}
                    onClick={() => setCurrentPostPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                )
              ))}

              <PageButton
                onClick={() => setCurrentPostPage(prev => Math.min(totalPostPages, prev + 1))}
                disabled={currentPostPage === totalPostPages}
              >
                →
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {activeTab === 'media' && (
        <>
          <FiltersContainer>
            <FilterGroup>
              <Select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value as 'all' | 'images' | 'videos')}
              >
                <option value="all">All Media</option>
                <option value="images">Images Only</option>
                <option value="videos">Videos Only</option>
              </Select>

              <Select
                value={mediaSortBy}
                onChange={(e) => setMediaSortBy(e.target.value as MediaSortField)}
              >
                <option value="added">Sort by Date</option>
                <option value="size">Sort by Size</option>
                <option value="duration">Sort by Duration</option>
              </Select>

              <SortDirectionSelect
                value={mediaSortDirection}
                onChange={(e) => setMediaSortDirection(e.target.value as 'asc' | 'desc')}
                title={mediaSortDirection === 'desc' ? 'Descending order' : 'Ascending order'}
              >
                <option value="desc" aria-label="Descending order">
                  {String.fromCharCode(8595)} {/* Down arrow */}
                </option>
                <option value="asc" aria-label="Ascending order">
                  {String.fromCharCode(8593)} {/* Up arrow */}
                </option>
              </SortDirectionSelect>
            </FilterGroup>

            <div>
              {getFilteredMedia().length} items
            </div>
          </FiltersContainer>

          <MediaGrid>
            {displayedMedia.length === 0 ? (
              <p>No media found matching your criteria.</p>
            ) : (
              displayedMedia.map((file, index) => (
                <MediaCard
                  key={file.id}
                  onClick={() => handleMediaClick(file, getFilteredMedia().findIndex(m => m.id === file.id))}
                >
                  <MediaPreview imageUrl={getThumbnailUrl(file)}>
                    {isVideo(file) && (
                      <VideoIndicator>
                        {file.duration ? formatDuration(file.duration) : 'Video'}
                      </VideoIndicator>
                    )}
                  </MediaPreview>
                  <MediaInfo>
                    <MediaTitle>{file.name}</MediaTitle>
                    <MediaMeta>
                      <span>{file.added ? formatTimestamp(file.added) : 'Unknown date'}</span>
                      <span>{((file.size || 0) / (1024 * 1024)).toFixed(1)} MB</span>
                    </MediaMeta>
                  </MediaInfo>
                </MediaCard>
              ))
            )}
          </MediaGrid>

          {totalMediaPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setCurrentMediaPage(prev => Math.max(1, prev - 1))}
                disabled={currentMediaPage === 1}
              >
                ←
              </PageButton>

              {uniqueMediaPageNumbers.map((pageNum, index) => (
                pageNum === -1 ? (
                  <span key={`ellipsis-media-${index}`} style={{ alignSelf: 'center' }}>...</span>
                ) : (
                  <PageButton
                    key={`media-page-${pageNum}`}
                    active={pageNum === currentMediaPage}
                    onClick={() => setCurrentMediaPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                )
              ))}

              <PageButton
                onClick={() => setCurrentMediaPage(prev => Math.min(totalMediaPages, prev + 1))}
                disabled={currentMediaPage === totalMediaPages}
              >
                →
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {selectedMedia && (
        <MediaViewerOverlay onClick={closeMediaViewer}>
          <CloseButton onClick={closeMediaViewer}>✕</CloseButton>
          <MediaViewerContent onClick={e => e.stopPropagation()}>
            {isVideo(selectedMedia) ? (
              <VideoPlayer
                id="media-viewer-video"
                src={getMediaUrl(selectedMedia)}
                controls
                autoPlay
              />
            ) : (
              <ImageViewer src={getMediaUrl(selectedMedia)} alt={selectedMedia.name} />
            )}

            <MediaViewerControls>
              <MediaViewerButton
                onClick={() => navigateMedia('prev')}
                title="Previous"
                disabled={getFilteredMedia().length <= 1}
              >
                ←
              </MediaViewerButton>

              {isVideo(selectedMedia) && (
                <>
                  <MediaViewerButton
                    onClick={() => skipVideo(-10)}
                    title="Back 10 seconds"
                  >
                    -10s
                  </MediaViewerButton>

                  <MediaViewerButton
                    onClick={() => skipVideo(10)}
                    title="Forward 10 seconds"
                  >
                    +10s
                  </MediaViewerButton>
                </>
              )}

              <MediaViewerButton
                onClick={() => navigateMedia('next')}
                title="Next"
                disabled={getFilteredMedia().length <= 1}
              >
                →
              </MediaViewerButton>
            </MediaViewerControls>
          </MediaViewerContent>
        </MediaViewerOverlay>
      )}
    </ProfileContainer>
  );
};

export default ProfilePage;