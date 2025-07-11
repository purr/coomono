import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ApiService } from '../services/api';
import type { Post, PostResponse, Attachment, Preview, Video, Props } from '../types/posts';
import type { File as MediaTypeFile } from '../types/common';

// Define a MediaFile type to replace the File interface
interface MediaFile extends MediaTypeFile {
  id: string;
  server?: string;
  type?: string; // 'file', 'attachment', 'preview', 'video', etc.
}

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
  background-color: ${props => !props.imageUrl ? ({ theme }) => theme.overlay : 'transparent'};
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: ${props => !props.imageUrl ? "'No Preview'" : "none"};
    color: ${({ theme }) => theme.subtle};
    font-size: 0.9rem;
  }
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
  const apiService = new ApiService();

  const [post, setPost] = useState<Post | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [props, setProps] = useState<Props | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);

  useEffect(() => {
    if (service && id && postId) {
      fetchPostData();
    }
  }, [service, id, postId]);

  const fetchPostData = async () => {
    if (!service || !id || !postId) return;

    setLoading(true);
    try {
      // Fetch post using the new API method
      const response = await apiService.getPost(service, id, postId);

      if (response.data) {
        const postData = response.data;
        setPost(postData.post);
        setAttachments(postData.attachments || []);
        setPreviews(postData.previews || []);
        setVideos(postData.videos || []);
        setProps(postData.props || null);

        // Process media files from the complete response
        const allMedia: MediaFile[] = [];
        // Keep track of file paths we've already added to prevent duplicates
        const addedPaths = new Set<string>();

        // Add videos first (highest priority)
        if (postData.videos && postData.videos.length > 0) {
          postData.videos.forEach((video, index) => {
            // Skip if we already have this file or if path is missing
            if (!video.path || addedPaths.has(video.path)) return;

            const mediaFile: MediaFile = {
              id: `video-${index}`,
              name: video.name,
              path: video.path,
              server: video.server,
              // Use 'video' type for videos
              type: 'video'
            };
            allMedia.push(mediaFile);
            addedPaths.add(video.path);
          });
        }

        // Add main file if it exists
        if (postData.post.file && postData.post.file.path) {
          // Skip if we already have this file
          if (!addedPaths.has(postData.post.file.path)) {
            const mainFile: MediaFile = {
              id: 'post-file',
              name: postData.post.file.name,
              path: postData.post.file.path,
              server: findServerForFile(postData.post.file.path, postData.previews),
              type: 'file'
            };
            allMedia.push(mainFile);
            addedPaths.add(postData.post.file.path);
          }
        }

        // Add attachments with server information
        if (postData.attachments && postData.attachments.length > 0) {
          postData.attachments.forEach((attachment, index) => {
            // Skip if we already have this file or if path is missing
            if (!attachment.path || addedPaths.has(attachment.path)) return;

            const mediaFile: MediaFile = {
              id: `attachment-${index}`,
              name: attachment.name,
              path: attachment.path,
              server: attachment.server,
              // Use 'attachment' type for attachments
              type: 'attachment'
            };
            allMedia.push(mediaFile);
            addedPaths.add(attachment.path);
          });
        }

        // Add previews with server information
        if (postData.previews && postData.previews.length > 0) {
          postData.previews.forEach((preview, index) => {
            // Skip if we already have this file or if path is missing
            if (!preview.path || addedPaths.has(preview.path)) return;

            const mediaFile: MediaFile = {
              id: `preview-${index}`,
              name: preview.name || `preview-${index}`,
              path: preview.path,
              server: preview.server,
              // Use 'thumbnail' type for previews to ensure correct URL construction
              type: 'thumbnail'
            };
            allMedia.push(mediaFile);
            addedPaths.add(preview.path);
          });
        }

        // Filter out any media files without a valid path
        const validMedia = allMedia.filter(file => !!file.path);

        console.log(`Found ${validMedia.length} valid media files out of ${allMedia.length} total:`, validMedia);
        setMediaFiles(validMedia);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to find the server for a file path from previews
  const findServerForFile = (path: string, previews: Preview[]): string => {
    const preview = previews.find(p => p.path === path);
    return preview?.server || '';
  };

  const handleMediaClick = (file: MediaFile, index: number) => {
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

  const isVideo = (file: MediaFile) => {
    if (!file) return false;

    // First check the name
    if (file.name && file.name.match(/\.(mp4|webm|mov|avi|wmv)$/i)) {
      return true;
    }

    // Fallback to checking the path
    if (file.path && file.path.match(/\.(mp4|webm|mov|avi|wmv)$/i)) {
      return true;
    }

    // If we have a type field, check that as well
    if (file.type === 'video') {
      return true;
    }

    return false;
  };

  const getMediaUrl = (file: MediaFile) => {
    if (!file || !file.path) {
      console.error('Invalid file or missing path:', file);
      return '';
    }

    // For images, always use thumbnail type
    if (!isVideo(file)) {
      return apiService.getFileUrl(file.path, file.server, 'thumbnail');
    }
    // For videos, use the original type
    return apiService.getFileUrl(file.path, file.server, file.type);
  };

  const getThumbnailUrl = (file: MediaFile) => {
    if (!file || !file.path) {
      console.error('Invalid file or missing path:', file);
      return '';
    }
    return apiService.getThumbnailUrl(file.path, file.server);
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
      <BackButton onClick={() => {
        const currentInstance = apiService.getCurrentApiInstance();
        navigate(`/${currentInstance.url}/${service}/user/${id}`);
      }}>
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

        {mediaFiles.length > 0 && mediaFiles.some(file => !!file.path) && (
          <MediaSection>
            <MediaTitle>Media ({mediaFiles.filter(file => !!file.path).length})</MediaTitle>
            <MediaGrid>
              {mediaFiles
                .filter(file => !!file.path)
                .map((file, index) => (
                <MediaCard
                  key={file.id}
                  onClick={() => handleMediaClick(file, index)}
                >
                  <MediaPreview imageUrl={file.path ? getThumbnailUrl(file) : undefined}>
                    {isVideo(file) && (
                      <VideoIndicator>
                        {file.duration ? formatDuration(file.duration) : 'Video'}
                      </VideoIndicator>
                    )}
                  </MediaPreview>
                  <MediaInfo>
                    <MediaName>{file.name || 'Untitled'}</MediaName>
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
                src={selectedMedia.path ? getMediaUrl(selectedMedia) : ''}
                controls
                autoPlay
                onError={(e) => {
                  console.error('Video playback error:', e);
                  alert('Error playing video. The file may be unavailable or in an unsupported format.');
                }}
              />
            ) : (
              <ImageViewer
                src={selectedMedia.path ? getMediaUrl(selectedMedia) : ''}
                alt={selectedMedia.name || 'Image'}
                onError={(e) => {
                  console.error('Image loading error:', e);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div style="padding: 20px; text-align: center;">Image failed to load</div>');
                }}
              />
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