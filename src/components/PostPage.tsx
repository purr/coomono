import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ApiService } from "../services/api";
import type { Post, Attachment, Preview, Video, Props } from "../types/posts";
import type { CreatorProfile } from "../types/profile";
import type { File as MediaTypeFile } from "../types/common";
import { handleLinkInteraction } from "../utils/helpers";
import { useNavigation } from "../context/NavigationContext";

// Define a MediaFile type to replace the File interface
interface MediaFile extends MediaTypeFile {
  id: string;
  server?: string;
  type?: string; // 'file', 'attachment', 'preview', 'video', etc.
  duration?: number; // Add duration property
}

// Styled components
const ContentContainer = styled.div`
  width: 100%;
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

const PostContent = styled.div.attrs({
  className: "post-content",
})`
  padding: 24px;
  line-height: 1.6;

  img {
    max-width: 100%;
    height: auto;
    cursor: pointer;
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
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

// Update the MediaPreview component to handle videos properly
const MediaPreview = styled.div<{ imageUrl?: string; isVideo?: boolean }>`
  width: 100%;
  height: 180px;
  background-image: ${(props) =>
    props.isVideo ? "none" : `url(${props.imageUrl || "none"})`};
  background-color: ${(props) =>
    !props.imageUrl && !props.isVideo
      ? ({ theme }) => theme.overlay
      : "transparent"};
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: ${(props) =>
      !props.imageUrl && !props.isVideo ? "'No Preview'" : "none"};
    color: ${({ theme }) => theme.subtle};
    font-size: 0.9rem;
  }
`;

const VideoPreview = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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
  width: 80%;
  height: 80vh;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NavigationButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const PrevButton = styled(NavigationButton)`
  left: -70px;
`;

const NextButton = styled(NavigationButton)`
  right: -70px;
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
  z-index: 1100;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const MediaContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const VideoPlayer = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const ImageViewer = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const PostPage: React.FC = () => {
  const { service, id, postId } = useParams<{
    service?: string;
    id?: string;
    postId?: string;
  }>();
  const navigate = useNavigate();
  const { startNavigation, endNavigation } = useNavigation();
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
  const [creator, setCreator] = useState<CreatorProfile | null>(null);

  // Define closeMediaViewer early using useCallback
  const closeMediaViewer = useCallback(() => {
    setSelectedMedia(null);
    setCurrentMediaIndex(-1);
  }, []);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedMedia) {
        closeMediaViewer();
      }
    };

    // Add event listener when media is selected
    if (selectedMedia) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Clean up event listener when component unmounts or media is closed
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedMedia, closeMediaViewer]);

  // Fetch post data on component mount
  useEffect(() => {
    if (service && id && postId) {
      fetchPostData();
      // Also fetch creator data for the header
      fetchCreatorData();
    }

    // Clean up navigation state when component unmounts
    return () => {
      endNavigation();
    };
  }, [service, id, postId]);

  // Process post content to prevent full page reloads from links and handle image clicks
  useEffect(() => {
    if (post?.content) {
      // Wait for the content to be rendered
      setTimeout(() => {
        // Find all links in the post content
        const contentLinks = document.querySelectorAll(".post-content a");

        // Add event listeners to handle SPA navigation
        contentLinks.forEach((link) => {
          link.addEventListener("click", (e) => {
            const target = e.currentTarget as HTMLAnchorElement;
            const href = target.getAttribute("href");

            // Only handle internal links
            if (
              href &&
              !href.startsWith("http") &&
              !href.startsWith("mailto:")
            ) {
              e.preventDefault();
              startNavigation();
              navigate(href);
            }
          });
        });

        // Find all images in the post content
        const contentImages = document.querySelectorAll(".post-content img");

        // Add event listeners to handle image clicks
        contentImages.forEach((img) => {
          // Add a class to make images appear clickable
          img.classList.add("clickable-image");

          img.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const clickedImg = e.currentTarget as HTMLImageElement;
            const src = clickedImg.getAttribute("src");

            if (src) {
              // Create a virtual media file for the clicked image
              const contentImageFile: MediaFile = {
                id: `content-image-${Date.now()}`,
                name: clickedImg.getAttribute("alt") || "Content image",
                path: src,
                type: "thumbnail",
              };

              // Open the image in the media viewer
              handleMediaClick(contentImageFile, -1); // -1 means it's not part of the mediaFiles array
            }
          });
        });
      }, 100);
    }
  }, [post, navigate, startNavigation]);

  // Add a style for clickable images
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .post-content img.clickable-image {
        cursor: pointer;
      }
    `;
    document.head.appendChild(styleElement);

    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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

        // Helper function to determine if a file is a video based on path
        const isVideoPath = (path: string) => {
          return !!path.match(/\.(mp4|webm|mov|avi|wmv)$/i);
        };

        // Process media files from the complete response
        const allMedia: MediaFile[] = [];
        // Keep track of file paths we've already added to prevent duplicates
        const addedPaths = new Set<string>();

        // Add videos first (highest priority)
        if (postData.videos && postData.videos.length > 0) {
          postData.videos.forEach((video, index) => {
            // Skip if we already have this file or if path is missing
            if (!video.path || addedPaths.has(video.path)) return;

            // Create media file with optional duration
            const mediaFile: MediaFile = {
              id: `video-${index}`,
              name: video.name,
              path: video.path,
              server: video.server,
              // Use 'file' type for videos to get the original file
              type: "file",
            };

            // Add duration if available (as a custom property)
            if ("duration" in video) {
              mediaFile.duration = (video as any).duration;
            }

            allMedia.push(mediaFile);
            addedPaths.add(video.path);
          });
        }

        // Add main file if it exists
        if (postData.post.file && postData.post.file.path) {
          // Skip if we already have this file
          if (!addedPaths.has(postData.post.file.path)) {
            const mainFile: MediaFile = {
              id: "post-file",
              name: postData.post.file.name,
              path: postData.post.file.path,
              server: findServerForFile(
                postData.post.file.path,
                postData.previews
              ),
              // Determine type based on file extension
              type: isVideoPath(postData.post.file.path) ? "file" : "thumbnail",
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
              // Determine type based on file extension
              type: isVideoPath(attachment.path) ? "file" : "attachment",
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
              // Determine type based on file extension
              type: isVideoPath(preview.path) ? "file" : "thumbnail",
            };
            allMedia.push(mediaFile);
            addedPaths.add(preview.path);
          });
        }

        // Filter out any media files without a valid path
        const validMedia = allMedia.filter((file) => !!file.path);

        console.log(
          `Found ${validMedia.length} valid media files out of ${allMedia.length} total:`,
          validMedia
        );
        setMediaFiles(validMedia);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a function to fetch creator data
  const fetchCreatorData = async () => {
    if (!service || !id) return;

    try {
      const response = await apiService.getCreatorProfile(service, id);
      if (response.data) {
        setCreator(response.data);
      }
    } catch (error) {
      console.error("Error fetching creator data:", error);
    }
  };

  // Helper function to find the server for a file path from previews
  const findServerForFile = (path: string, previews: Preview[]): string => {
    const preview = previews.find((p) => p.path === path);
    return preview?.server || "";
  };

  const handleMediaClick = (
    file: MediaFile,
    index: number,
    e?: React.MouseEvent
  ) => {
    // If an event was passed, prevent default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setSelectedMedia(file);
    setCurrentMediaIndex(index);
  };

  const navigateMedia = (direction: "next" | "prev") => {
    if (currentMediaIndex === -1 || mediaFiles.length <= 1) return;

    const newIndex =
      direction === "next"
        ? (currentMediaIndex + 1) % mediaFiles.length
        : (currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length;

    setSelectedMedia(mediaFiles[newIndex]);
    setCurrentMediaIndex(newIndex);
  };

  const skipVideo = (seconds: number) => {
    const videoElement = document.getElementById(
      "media-viewer-video"
    ) as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime += seconds;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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
    if (file.type === "video") {
      return true;
    }

    return false;
  };

  const getMediaUrl = (file: MediaFile) => {
    if (!file || !file.path) {
      console.error("Invalid file or missing path:", file);
      return "";
    }

    // For videos, use the original file URL (not thumbnail)
    if (isVideo(file)) {
      // Use 'file' type for videos to get the original file
      return apiService.getFileUrl(file.path, file.server, "file");
    }

    // For images, use thumbnail type
    return apiService.getFileUrl(file.path, file.server, "thumbnail");
  };

  const getThumbnailUrl = (file: MediaFile) => {
    if (!file || !file.path) {
      console.error("Invalid file or missing path:", file);
      return "";
    }
    return apiService.getThumbnailUrl(file.path, file.server);
  };

  // Format timestamp for the CreatorHeader component
  const formatTimestampForHeader = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <ContentContainer>
        <div style={{ padding: "2rem 0", textAlign: "center" }}>
          <p>Loading post content...</p>
        </div>
      </ContentContainer>
    );
  }

  if (!post) {
    return (
      <ContentContainer>
        <div style={{ padding: "2rem 0", textAlign: "center" }}>
          <p>Post not found</p>
        </div>
      </ContentContainer>
    );
  }

  // Generate the creator profile URL for navigation
  const creatorProfileUrl = `/${
    apiService.getCurrentApiInstance().url
  }/${service}/user/${id}`;

  // Handle navigation with right-click support
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startNavigation();
    navigate(creatorProfileUrl);
  };

  const backLinkProps = handleLinkInteraction(
    creatorProfileUrl,
    handleBackClick,
    startNavigation
  );

  return (
    <ContentContainer>
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

        {post?.content && (
          <PostContent dangerouslySetInnerHTML={{ __html: post.content }} />
        )}

        {mediaFiles.length > 0 && mediaFiles.some((file) => !!file.path) && (
          <MediaSection>
            <MediaTitle>
              Media ({mediaFiles.filter((file) => !!file.path).length})
            </MediaTitle>
            <MediaGrid>
              {mediaFiles
                .filter((file) => !!file.path)
                .map((file, index) => (
                  <MediaCard
                    key={file.id}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent any default navigation
                      handleMediaClick(file, index, e);
                    }}
                    className="media-thumbnail"
                  >
                    <MediaPreview
                      imageUrl={
                        !isVideo(file) ? getThumbnailUrl(file) : undefined
                      }
                      isVideo={isVideo(file)}
                    >
                      {isVideo(file) && (
                        <>
                          <VideoPreview
                            src={getMediaUrl(file)}
                            preload="metadata"
                            muted
                          />
                          <VideoIndicator>
                            {file.duration
                              ? formatDuration(file.duration)
                              : "Video"}
                          </VideoIndicator>
                        </>
                      )}
                    </MediaPreview>
                    <MediaInfo>
                      <MediaName>{file.name || "Untitled"}</MediaName>
                    </MediaInfo>
                  </MediaCard>
                ))}
            </MediaGrid>
          </MediaSection>
        )}
      </PostContainer>

      {selectedMedia && (
        <MediaViewerOverlay
          onClick={(e) => {
            // Only close if clicking directly on the overlay (not its children)
            if (e.target === e.currentTarget) {
              closeMediaViewer();
            }
          }}
        >
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              closeMediaViewer();
            }}
          >
            ✕
          </CloseButton>
          <MediaViewerContent onClick={(e) => e.stopPropagation()}>
            <PrevButton
              onClick={(e) => {
                e.stopPropagation();
                navigateMedia("prev");
              }}
              disabled={mediaFiles.length <= 1}
            >
              ←
            </PrevButton>

            <MediaContainer>
              {isVideo(selectedMedia) ? (
                <VideoPlayer
                  id="media-viewer-video"
                  src={selectedMedia.path ? getMediaUrl(selectedMedia) : ""}
                  controls
                  autoPlay
                  onError={(e) => {
                    console.error("Video playback error:", e);
                    alert(
                      "Error playing video. The file may be unavailable or in an unsupported format."
                    );
                  }}
                />
              ) : (
                <ImageViewer
                  src={selectedMedia.path ? getMediaUrl(selectedMedia) : ""}
                  alt={selectedMedia.name || "Image"}
                  onError={(e) => {
                    console.error("Image loading error:", e);
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.insertAdjacentHTML(
                      "beforeend",
                      '<div style="padding: 20px; text-align: center;">Image failed to load</div>'
                    );
                  }}
                />
              )}
            </MediaContainer>

            <NextButton
              onClick={(e) => {
                e.stopPropagation();
                navigateMedia("next");
              }}
              disabled={mediaFiles.length <= 1}
            >
              →
            </NextButton>

            {isVideo(selectedMedia) && (
              <MediaViewerControls>
                <MediaViewerButton
                  onClick={(e) => {
                    e.stopPropagation();
                    skipVideo(-10);
                  }}
                  title="Back 10 seconds"
                >
                  -10s
                </MediaViewerButton>

                <MediaViewerButton
                  onClick={(e) => {
                    e.stopPropagation();
                    skipVideo(10);
                  }}
                  title="Forward 10 seconds"
                >
                  +10s
                </MediaViewerButton>
              </MediaViewerControls>
            )}
          </MediaViewerContent>
        </MediaViewerOverlay>
      )}
    </ContentContainer>
  );
};

export default PostPage;
