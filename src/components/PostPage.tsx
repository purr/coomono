import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ApiService } from '../services/api';
import type { Post, File } from '../types/api';

// Styled components
const PostPageContainer = styled.div`
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

const PostContainer = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
`;

const PostHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.highlightLow};
`;

const PostTitle = styled.h1`
  margin: 0;
  margin-bottom: 8px;
  font-size: 2rem;
`;

const PostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: ${({ theme }) => theme.subtle};
`;

const PostMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PostContent = styled.div`
  padding: 24px;
  line-height: 1.6;

  img {
    max-width: 100%;
    height: auto;
  }

  p {
    margin-bottom: 1rem;
  }
`;

const MediaSection = styled.div`
  padding: 0 24px 24px;
`;

const MediaTitle = styled.h2`
  margin-bottom: 16px;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const MediaCard = styled.div`
  background: ${({ theme }) => theme.overlay};
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

const MediaName = styled.h4`
  margin: 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

const PostPage: React.FC = () => {
  const { service, id, postId } = useParams<{ service: string; id: string; postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);

  const apiService = new ApiService();

  useEffect(() => {
    const fetchPostData = async () => {
      if (!service || !id || !postId) return;

      setLoading(true);
      try {
        // Fetch creator posts
        const postsResponse = await apiService.getCreatorPosts(service, id);
        if (postsResponse.data) {
          // Find the specific post
          const foundPost = postsResponse.data.find(p => p.id === postId);
          if (foundPost) {
            setPost(foundPost);

            // Get timestamp from post published date or use current time
            const timestamp = typeof foundPost.published === 'string' && foundPost.published
              ? new Date(foundPost.published).getTime() / 1000
              : Date.now() / 1000;

            // Collect all media files from the post
            const files: File[] = [];

            // Add main file if exists
            if (foundPost.file) {
              files.push({
                id: `${foundPost.id}-main`,
                name: foundPost.file.name,
                path: foundPost.file.path,
                added: timestamp
              });
            }

            // Add attachments if exist
            if (foundPost.attachments && foundPost.attachments.length > 0) {
              foundPost.attachments.forEach((attachment, index) => {
                files.push({
                  id: `${foundPost.id}-attachment-${index}`,
                  name: attachment.name,
                  path: attachment.path,
                  added: timestamp
                });
              });
            }

            setMediaFiles(files);
          }
        }
      } catch (error) {
        console.error('Error fetching post data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [service, id, postId]);

  const handleMediaClick = (file: File, index: number) => {
    setSelectedMedia(file);
    setCurrentMediaIndex(index);
  };

  const closeMediaViewer = () => {
    setSelectedMedia(null);
    setCurrentMediaIndex(-1);
  };

  const navigateMedia = (direction: 'next' | 'prev') => {
    if (currentMediaIndex === -1 || mediaFiles.length <= 1) return;

    const newIndex = direction === 'next'
      ? (currentMediaIndex + 1) % mediaFiles.length
      : (currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length;

    setSelectedMedia(mediaFiles[newIndex]);
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  if (loading) {
    return (
      <PostPageContainer>
        <p>Loading post...</p>
      </PostPageContainer>
    );
  }

  if (!post) {
    return (
      <PostPageContainer>
        <p>Post not found</p>
      </PostPageContainer>
    );
  }

  return (
    <PostPageContainer>
      <BackButton onClick={() => navigate(`/profile/${service}/${id}`)}>
        ← Back to Creator Profile
      </BackButton>

      <PostContainer>
        <PostHeader>
          <PostTitle>{post?.title}</PostTitle>
          <PostMeta>
            <PostMetaItem>
              <span>Published:</span>
              <strong>{formatDate(post?.published)}</strong>
            </PostMetaItem>
            {post?.added && (
              <PostMetaItem>
                <span>Added to archive:</span>
                <strong>{formatDate(post.added)}</strong>
              </PostMetaItem>
            )}
            {post?.edited && (
              <PostMetaItem>
                <span>Edited:</span>
                <strong>{formatDate(post.edited)}</strong>
              </PostMetaItem>
            )}
          </PostMeta>
        </PostHeader>

        {post?.content && <PostContent dangerouslySetInnerHTML={{ __html: post.content }} />}

        {mediaFiles.length > 0 && (
          <MediaSection>
            <MediaTitle>Media ({mediaFiles.length})</MediaTitle>
            <MediaGrid>
              {mediaFiles.map((file, index) => (
                <MediaCard
                  key={file.id}
                  onClick={() => handleMediaClick(file, index)}
                >
                  <MediaPreview imageUrl={getThumbnailUrl(file)}>
                    {isVideo(file) && (
                      <VideoIndicator>
                        {file.duration ? formatDuration(file.duration) : 'Video'}
                      </VideoIndicator>
                    )}
                  </MediaPreview>
                  <MediaInfo>
                    <MediaName>{file.name}</MediaName>
                  </MediaInfo>
                </MediaCard>
              ))}
            </MediaGrid>
          </MediaSection>
        )}
      </PostContainer>

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
                disabled={mediaFiles.length <= 1}
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
                disabled={mediaFiles.length <= 1}
              >
                →
              </MediaViewerButton>
            </MediaViewerControls>
          </MediaViewerContent>
        </MediaViewerOverlay>
      )}
    </PostPageContainer>
  );
};

export default PostPage;