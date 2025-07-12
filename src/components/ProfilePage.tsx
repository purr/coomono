import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ApiService } from "../services/api";
import type { LegacyPost } from "../types/posts-legacy";
import type { File as MediaTypeFile } from "../types/common";
import { handleLinkInteraction } from "../utils/helpers";
import { useNavigation } from "../context/NavigationContext";
import { useCreator } from "../context/CreatorContext";

// Define a MediaFile type to replace the File interface
interface MediaFile extends MediaTypeFile {
  id: string;
  server?: string;
}

// Styled components
const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
`;

const ContentContainer = styled.div`
  width: 100%;
`;

const BackButton = styled.a`
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
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.highlightMed};
    text-decoration: none;
  }

  &:visited {
    color: ${({ theme }) => theme.text};
    text-decoration: none;
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
  color: ${({ theme, active }) => (active ? theme.text : theme.subtle)};
  font-size: 1.1rem;
  font-weight: ${({ active }) => (active ? "600" : "400")};
  cursor: pointer;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${({ theme, active }) => (active ? theme.rose : "transparent")};
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
    font-family: "Arial", sans-serif;
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
  background: ${({ theme, active }) => (active ? theme.rose : theme.overlay)};
  color: ${({ theme, active }) => (active ? theme.base : theme.text)};
  border: 1px solid
    ${({ theme, active }) => (active ? theme.rose : theme.highlightMed)};

  &:hover {
    background: ${({ theme, active }) =>
    active ? theme.rose : theme.highlightMed};
  }
`;

// Posts section
const PostsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PostCard = styled.a`
  background: ${({ theme }) => theme.surface};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: block;
  color: inherit;
  text-decoration: none;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    text-decoration: none;

    h3 {
      color: ${({ theme }) => theme.foam};
    }
  }

  &:visited {
    color: inherit;
    text-decoration: none;
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
  color: ${({ theme }) => theme.text};
  transition: color 0.2s ease;
`;

const PostDate = styled.span`
  color: ${({ theme }) => theme.subtle};
  font-size: 0.9rem;
`;

const PostContent = styled.div<{ expanded: boolean }>`
  padding: 16px;
  max-height: ${(props) => (props.expanded ? "none" : "200px")};
  overflow: hidden;
  position: relative;

  img {
    max-width: 100%;
    height: auto;
    cursor: pointer;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: ${(props) => (props.expanded ? "0" : "80px")};
    background: ${(props) =>
    props.expanded
      ? "none"
      : "linear-gradient(to top, var(--surface), transparent)"};
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

// Update MediaThumbnail to handle videos
const MediaThumbnail = styled.div<{ imageUrl?: string; isVideo?: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 4px;
  background-image: ${(props) =>
    props.isVideo ? "none" : `url(${props.imageUrl || "none"})`};
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    opacity: 0.9;
  }
`;

const VideoThumbnail = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

// Update MediaPreview for the media grid
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

const MediaTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Update MediaMeta to show duration for videos
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

// Define interface and types
interface ExpandedPostState {
  [key: string]: boolean;
}

type PostSortField = "published" | "title";
type MediaSortField = "added" | "duration";

const ProfilePage: React.FC = () => {
  const { service, id } = useParams<{ service?: string; id?: string }>();
  const navigate = useNavigate();
  const { startNavigation, endNavigation } = useNavigation();
  const { creator } = useCreator();
  const apiService = new ApiService();

  const [posts, setPosts] = useState<LegacyPost[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");
  const [expandedPosts, setExpandedPosts] = useState<ExpandedPostState>({});
  const [postsPage, setPostsPage] = useState<number>(1);
  const [mediaPage, setMediaPage] = useState<number>(1);
  const [postSortBy, setPostSortBy] = useState<PostSortField>("published");
  const [postSortDirection, setPostSortDirection] = useState<"asc" | "desc">(
    "desc"
  );
  const [mediaSortBy, setMediaSortBy] = useState<MediaSortField>("added");
  const [mediaSortDirection, setMediaSortDirection] = useState<"asc" | "desc">(
    "desc"
  );
  const [mediaType, setMediaType] = useState<string>("all");
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);

  // Add a state to store dynamically loaded video durations
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>(
    {}
  );

  const postsPerPage = 10;
  const mediaPerPage = 24;

  // Define closeMediaViewer early
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

  // Fetch creator data on component mount
  useEffect(() => {
    if (service && id) {
      fetchCreatorData();
    }

    // Clean up navigation state when component unmounts
    return () => {
      endNavigation();
    };
  }, [service, id]);

  // Add event listeners to post content images
  useEffect(() => {
    // Process post content to handle image clicks
    const processPostContent = () => {
      // Find all posts with content
      const postContents = document.querySelectorAll(".post-content img");

      // Add event listeners to handle image clicks
      postContents.forEach((img) => {
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
              server: "",
              type: "thumbnail",
            };

            // Open the image in the media viewer
            handleMediaClick(contentImageFile, -1);
          }
        });
      });
    };

    // Process post content after a short delay to ensure it's rendered
    if (!loading) {
      setTimeout(processPostContent, 300);
    }

    return () => {
      // No cleanup needed as the elements will be removed from DOM
    };
  }, [loading, posts]);

  // Function to fetch creator data
  const fetchCreatorData = async () => {
    if (!service || !id) return;

    setLoading(true);

    try {
      // Fetch creator posts
      const postsResponse = await apiService.getCreatorPosts(service, id);

      if (postsResponse.data) {
        setPosts(postsResponse.data);

        // Process media files from posts
        const allMedia: MediaFile[] = [];
        postsResponse.data.forEach((post) => {
          const postMedia = getPostMediaFiles(post);
          allMedia.push(...postMedia);
        });

        setMedia(allMedia);
      }
    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandPost = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
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
    if (currentMediaIndex === -1) return;

    const filteredMediaList = getFilteredMedia(); // Use a local variable to avoid re-calculating
    const newIndex =
      direction === "next"
        ? (currentMediaIndex + 1) % filteredMediaList.length
        : (currentMediaIndex - 1 + filteredMediaList.length) %
        filteredMediaList.length;

    setSelectedMedia(filteredMediaList[newIndex]);
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
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Update formatDuration to handle null case
  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "Loading...";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Helper function to determine if a file is a video based on path
  const isVideoPath = (path: string) => {
    return !!path.match(/\.(mp4|webm|mov|avi|wmv)$/i);
  };

  // Define isVideo function before it's used
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

  // Function to handle video metadata loaded event
  const handleVideoMetadataLoaded = (
    file: MediaFile,
    e: React.SyntheticEvent<HTMLVideoElement>
  ) => {
    const video = e.currentTarget;
    if (video && video.duration && video.duration !== Infinity) {
      setVideoDurations((prev) => ({
        ...prev,
        [file.id]: video.duration,
      }));
    }
  };

  // Function to get video duration (either from file metadata or dynamically loaded)
  const getVideoDuration = (file: MediaFile) => {
    // First check if we have a dynamically loaded duration
    if (videoDurations[file.id]) {
      return videoDurations[file.id];
    }

    // Then check if the file has a duration property
    if (file.duration) {
      return file.duration;
    }

    // Otherwise return null
    return null;
  };

  // Get sorted and paginated posts
  const getSortedAndPaginatedPosts = () => {
    // Sort posts based on the selected sort field and direction
    const sortedPosts = [...posts].sort((a, b) => {
      const getDate = (dateStr: string | undefined) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      };

      if (postSortBy === "published") {
        const dateA = getDate(a.published);
        const dateB = getDate(b.published);
        return postSortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else if (postSortBy === "title") {
        const titleA = a.title || "";
        const titleB = b.title || "";
        return postSortDirection === "asc"
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      }
      return 0;
    });

    // Paginate posts
    const indexOfLastPost = postsPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    return sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  };

  const displayedPosts = getSortedAndPaginatedPosts();
  const totalPostPages = Math.ceil(posts.length / postsPerPage);
  const postPageNumbers: number[] = [];
  for (let i = 1; i <= totalPostPages; i++) {
    if (
      i === 1 || // First page
      i === totalPostPages || // Last page
      (i >= postsPage - 1 && i <= postsPage + 1) // Pages around current
    ) {
      postPageNumbers.push(i);
    } else if (
      (i === 2 && postsPage > 3) || // Ellipsis after first page
      (i === totalPostPages - 1 && postsPage < totalPostPages - 2) // Ellipsis before last page
    ) {
      postPageNumbers.push(-1); // -1 represents an ellipsis
    }
  }
  const uniquePostPageNumbers = postPageNumbers.filter(
    (num, index, arr) => arr.indexOf(num) === index
  );

  // Update the getFilteredMedia function to sort by duration
  const getFilteredMedia = () => {
    // Filter out files with no path first
    let filteredMedia = media.filter((file) => !!file && !!file.path);

    // Apply media type filter
    if (mediaType === "images") {
      filteredMedia = filteredMedia.filter((file) => {
        // Check file name first
        if (file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return true;
        }
        // Then check path
        return file.path.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      });
    } else if (mediaType === "videos") {
      filteredMedia = filteredMedia.filter((file) => {
        // Check file name first
        if (file.name && file.name.match(/\.(mp4|webm|mov|avi|wmv)$/i)) {
          return true;
        }
        // Then check path
        return file.path.match(/\.(mp4|webm|mov|avi|wmv)$/i);
      });
    }

    // Apply sorting
    filteredMedia.sort((a, b) => {
      if (mediaSortBy === "added") {
        const aAdded = a.added || 0;
        const bAdded = b.added || 0;
        return mediaSortDirection === "asc" ? aAdded - bAdded : bAdded - aAdded;
      } else if (mediaSortBy === "duration") {
        // Get durations, treating images as 0 seconds
        const aDuration = isVideo(a) ? getVideoDuration(a) || 0 : 0;
        const bDuration = isVideo(b) ? getVideoDuration(b) || 0 : 0;
        return mediaSortDirection === "asc"
          ? aDuration - bDuration
          : bDuration - aDuration;
      }
      return 0;
    });

    return filteredMedia;
  };

  const paginatedMedia = () => {
    const filteredMedia = getFilteredMedia();
    const indexOfLastMedia = mediaPage * mediaPerPage;
    const indexOfFirstMedia = indexOfLastMedia - mediaPerPage;
    return filteredMedia.slice(indexOfFirstMedia, indexOfLastMedia);
  };

  const displayedMedia = paginatedMedia();
  const totalMediaPages = Math.ceil(getFilteredMedia().length / mediaPerPage);
  const mediaPageNumbers: number[] = [];
  for (let i = 1; i <= totalMediaPages; i++) {
    if (
      i === 1 || // First page
      i === totalMediaPages || // Last page
      (i >= mediaPage - 1 && i <= mediaPage + 1) // Pages around current
    ) {
      mediaPageNumbers.push(i);
    } else if (
      (i === 2 && mediaPage > 3) || // Ellipsis after first page
      (i === totalMediaPages - 1 && mediaPage < totalMediaPages - 2) // Ellipsis before last page
    ) {
      mediaPageNumbers.push(-1); // -1 represents an ellipsis
    }
  }
  const uniqueMediaPageNumbers = mediaPageNumbers.filter(
    (num, index, arr) => arr.indexOf(num) === index
  );

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

  // Get all media files for a post (main file + attachments)
  const getPostMediaFiles = (post: LegacyPost): MediaFile[] => {
    const files: MediaFile[] = [];
    const timestamp = post.published
      ? Math.floor(new Date(post.published).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Keep track of file paths we've already added to prevent duplicates
    const addedPaths = new Set<string>();

    // Add main file if exists
    if (post.file && post.file.path) {
      files.push({
        ...post.file,
        id: `${post.id}-main`,
        added: timestamp,
        // Determine type based on file extension
        type: isVideoPath(post.file.path) ? "file" : "thumbnail",
      });
      addedPaths.add(post.file.path);
    }

    // Add attachments if exist
    if (post.attachments && post.attachments.length > 0) {
      post.attachments.forEach((attachment, index) => {
        // Skip if we already have this file or if path is missing
        if (!attachment.path || addedPaths.has(attachment.path)) return;

        files.push({
          ...attachment,
          id: `${post.id}-attachment-${index}`,
          added: timestamp,
          // Determine type based on file extension
          type: isVideoPath(attachment.path) ? "file" : "attachment",
        });
        addedPaths.add(attachment.path);
      });
    }

    // Check for _attachments (for videos)
    if (post._attachments && post._attachments.length > 0) {
      post._attachments.forEach((attachment: any, index: number) => {
        // Skip if path is missing
        if (!attachment.path) return;

        // Check if this attachment already exists in files
        if (addedPaths.has(attachment.path)) {
          // Update existing file with server info if needed
          const existingIndex = files.findIndex(
            (f) => f.path === attachment.path
          );
          if (existingIndex >= 0 && !files[existingIndex].server) {
            files[existingIndex].server = attachment.server;
          }
        } else {
          // Add as new file
          files.push({
            id: `${post.id}-result-attachment-${index}`,
            name: attachment.name,
            path: attachment.path,
            server: attachment.server,
            // Determine type based on file extension
            type: isVideoPath(attachment.path) ? "file" : "thumbnail",
            added: timestamp,
          });
          addedPaths.add(attachment.path);
        }
      });
    }

    // Add preview files if they exist
    if (post._previews && post._previews.length > 0) {
      post._previews.forEach((preview, index) => {
        // Skip if path is missing
        if (!preview.path) return;

        // Check if this preview already exists in files
        if (addedPaths.has(preview.path)) {
          // Update existing file with server info if needed
          const existingIndex = files.findIndex((f) => f.path === preview.path);
          if (existingIndex >= 0 && !files[existingIndex].server) {
            files[existingIndex].server = preview.server;
          }
        } else {
          // Add as new file
          files.push({
            id: `${post.id}-preview-${index}`,
            name: preview.name || `preview-${index}`,
            path: preview.path,
            server: preview.server,
            // Determine type based on file extension
            type: isVideoPath(preview.path) ? "file" : "thumbnail",
            added: timestamp,
          });
          addedPaths.add(preview.path);
        }
      });
    }

    // Return only files with valid paths
    return files.filter((file) => !!file.path);
  };

  // Navigate to full post view
  const navigateToPost = (post: LegacyPost) => {
    startNavigation();
    const currentInstance = apiService.getCurrentApiInstance();
    navigate(`/${currentInstance.url}/${service}/user/${id}/post/${post.id}`);
  };

  const handlePostClick = (e: React.MouseEvent, post: LegacyPost) => {
    e.preventDefault(); // This is critical to prevent the browser from following the href
    navigateToPost(post);
  };

  if (loading) {
    return (
      <ContentContainer>
        <div style={{ padding: "2rem 0", textAlign: "center" }}>
          <p>Loading creator content...</p>
        </div>
      </ContentContainer>
    );
  }

  // Create a safe creator object that always has the required properties
  const safeCreator = creator || {
    id: id || "",
    name: id || "",
    service: service || "",
    favorited: 0,
    updated: Math.floor(Date.now() / 1000),
    links: [],
  };

  return (
    <ProfileContainer>
      <TabsContainer>
        <Tab
          active={activeTab === "posts"}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </Tab>
        <Tab
          active={activeTab === "media"}
          onClick={() => setActiveTab("media")}
        >
          Media
        </Tab>
      </TabsContainer>

      {activeTab === "posts" && (
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
                onChange={(e) =>
                  setPostSortDirection(e.target.value as "asc" | "desc")
                }
                title={
                  postSortDirection === "desc"
                    ? "Descending order"
                    : "Ascending order"
                }
              >
                <option value="desc" aria-label="Descending order">
                  {String.fromCharCode(8595)} {/* Down arrow */}
                </option>
                <option value="asc" aria-label="Ascending order">
                  {String.fromCharCode(8593)} {/* Up arrow */}
                </option>
              </SortDirectionSelect>
            </FilterGroup>

            <div>{posts.length} posts</div>
          </FiltersContainer>
          <PostsContainer>
            {displayedPosts.length === 0 ? (
              <p>No posts found for this creator.</p>
            ) : (
              displayedPosts.map((post) => {
                const postFiles = getPostMediaFiles(post);
                const postUrl = `/${apiService.getCurrentApiInstance().url
                  }/${service}/user/${id}/post/${post.id}`;
                const linkProps = handleLinkInteraction(
                  postUrl,
                  (e) => handlePostClick(e, post),
                  startNavigation
                );

                return (
                  <PostCard
                    key={post.id}
                    href={postUrl}
                    {...linkProps}
                    data-spa-navigation="post"
                    onClick={(e) => {
                      // Only navigate if the click is directly on the card, not on media thumbnails
                      if (
                        e.target instanceof Element &&
                        (e.target.closest(".media-thumbnail") ||
                          e.target.closest(".media-thumbnail-wrapper"))
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      handlePostClick(e, post);
                    }}
                  >
                    <PostHeader>
                      <PostTitle>
                        {post.title ||
                          `Post from ${formatDate(post.published)}`}
                      </PostTitle>
                      <PostDate>{formatDate(post.published)}</PostDate>
                    </PostHeader>

                    {post.content && (
                      <>
                        <PostContent expanded={!!expandedPosts[post.id]}>
                          <div
                            dangerouslySetInnerHTML={{ __html: post.content }}
                          />
                        </PostContent>
                        {post.content.length > 300 && (
                          <ExpandButton
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigating to post view
                              toggleExpandPost(post.id);
                            }}
                          >
                            {expandedPosts[post.id] ? "Show Less" : "Show More"}
                          </ExpandButton>
                        )}
                      </>
                    )}

                    {postFiles.length > 0 && (
                      <PostMedia>
                        {postFiles.slice(0, 6).map((file) => (
                          <MediaThumbnail
                            key={file.id}
                            imageUrl={
                              !isVideo(file) ? getThumbnailUrl(file) : undefined
                            }
                            isVideo={isVideo(file)}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent any default navigation
                              e.stopPropagation(); // Prevent navigating to post view
                              handleMediaClick(
                                file,
                                media.findIndex((m) => m.id === file.id),
                                e
                              );
                            }}
                            className="media-thumbnail"
                          >
                            {isVideo(file) && (
                              <>
                                <VideoThumbnail
                                  src={getMediaUrl(file)}
                                  preload="metadata"
                                  muted
                                  onLoadedMetadata={(e) =>
                                    handleVideoMetadataLoaded(file, e)
                                  }
                                />
                                <VideoIndicator>
                                  {getVideoDuration(file)
                                    ? formatDuration(getVideoDuration(file))
                                    : "Loading..."}
                                </VideoIndicator>
                              </>
                            )}
                          </MediaThumbnail>
                        ))}
                        {postFiles.length > 6 && (
                          <MediaThumbnail
                            className="media-thumbnail-wrapper"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Navigate to post to see all media
                              navigateToPost(post);
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100%",
                                background: "rgba(0,0,0,0.7)",
                              }}
                            >
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
                onClick={() => setPostsPage((prev) => Math.max(1, prev - 1))}
                disabled={postsPage === 1}
              >
                ←
              </PageButton>

              {uniquePostPageNumbers.map((pageNum, index) =>
                pageNum === -1 ? (
                  <span
                    key={`ellipsis-post-${index}`}
                    style={{ alignSelf: "center" }}
                  >
                    ...
                  </span>
                ) : (
                  <PageButton
                    key={`post-page-${pageNum}`}
                    active={pageNum === postsPage}
                    onClick={() => setPostsPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                )
              )}

              <PageButton
                onClick={() =>
                  setPostsPage((prev) => Math.min(totalPostPages, prev + 1))
                }
                disabled={postsPage === totalPostPages}
              >
                →
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {activeTab === "media" && (
        <>
          <FiltersContainer>
            <FilterGroup>
              <Select
                value={mediaType}
                onChange={(e) =>
                  setMediaType(e.target.value as "all" | "images" | "videos")
                }
              >
                <option value="all">All Media</option>
                <option value="images">Images Only</option>
                <option value="videos">Videos Only</option>
              </Select>

              <Select
                value={mediaSortBy}
                onChange={(e) =>
                  setMediaSortBy(e.target.value as MediaSortField)
                }
              >
                <option value="added">Sort by Date</option>
                <option value="duration">Sort by Duration</option>
              </Select>

              <SortDirectionSelect
                value={mediaSortDirection}
                onChange={(e) =>
                  setMediaSortDirection(e.target.value as "asc" | "desc")
                }
                title={
                  mediaSortDirection === "desc"
                    ? "Descending order"
                    : "Ascending order"
                }
              >
                <option value="desc" aria-label="Descending order">
                  {String.fromCharCode(8595)} {/* Down arrow */}
                </option>
                <option value="asc" aria-label="Ascending order">
                  {String.fromCharCode(8593)} {/* Up arrow */}
                </option>
              </SortDirectionSelect>
            </FilterGroup>

            <div>{getFilteredMedia().length} items</div>
          </FiltersContainer>

          <MediaGrid>
            {displayedMedia.length === 0 ? (
              <p>No media found matching your criteria.</p>
            ) : (
              displayedMedia.map((file, index) => (
                <MediaCard
                  key={file.id}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent any default navigation
                    handleMediaClick(
                      file,
                      getFilteredMedia().findIndex((m) => m.id === file.id),
                      e
                    );
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
                          onLoadedMetadata={(e) =>
                            handleVideoMetadataLoaded(file, e)
                          }
                        />
                        <VideoIndicator>
                          {getVideoDuration(file)
                            ? formatDuration(getVideoDuration(file))
                            : "Loading..."}
                        </VideoIndicator>
                      </>
                    )}
                  </MediaPreview>
                  <MediaInfo>
                    <MediaTitle>{file.name || "Untitled"}</MediaTitle>
                    <MediaMeta>
                      <span>
                        {file.added
                          ? formatTimestamp(file.added)
                          : "Unknown date"}
                      </span>
                      {isVideo(file) && (
                        <span>
                          {getVideoDuration(file)
                            ? formatDuration(getVideoDuration(file))
                            : "Loading..."}
                        </span>
                      )}
                    </MediaMeta>
                  </MediaInfo>
                </MediaCard>
              ))
            )}
          </MediaGrid>

          {totalMediaPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setMediaPage((prev) => Math.max(1, prev - 1))}
                disabled={mediaPage === 1}
              >
                ←
              </PageButton>

              {uniqueMediaPageNumbers.map((pageNum, index) =>
                pageNum === -1 ? (
                  <span
                    key={`ellipsis-media-${index}`}
                    style={{ alignSelf: "center" }}
                  >
                    ...
                  </span>
                ) : (
                  <PageButton
                    key={`media-page-${pageNum}`}
                    active={pageNum === mediaPage}
                    onClick={() => setMediaPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                )
              )}

              <PageButton
                onClick={() =>
                  setMediaPage((prev) => Math.min(totalMediaPages, prev + 1))
                }
                disabled={mediaPage === totalMediaPages}
              >
                →
              </PageButton>
            </Pagination>
          )}
        </>
      )}

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
              disabled={getFilteredMedia().length <= 1}
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
              disabled={getFilteredMedia().length <= 1}
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
    </ProfileContainer>
  );
};

export default ProfilePage;
