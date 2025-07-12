import { ApiPath, DEFAULT_API_INSTANCES } from "../types/common";
import type { ApiResponse, ApiInstance } from '../types/common';
import type { Creator, CreatorsResponse } from '../types/creators';
import type { CreatorProfile, ProfileResponse } from '../types/profile';
import type { Post, PostResponse } from '../types/posts';
import type { PostsLegacyResponse, LegacyPost } from '../types/posts-legacy';

/**
 * API service for interacting with kemono-style APIs
 */
export class ApiService {
    private static instance: ApiService;
    private currentApiInstance!: ApiInstance;
    private availableInstances: ApiInstance[] = [];

    // Session-wide cache for creators list (preserved across the singleton)
    private static creatorsCache: {
        [domain: string]: {
            data: Creator[] | null;
            error: string | null;
            timestamp: number;
        }
    } = {};

    // Cache expiration time in milliseconds (24 hours)
    private static CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

    constructor(apiInstance?: ApiInstance) {
        // Ensure singleton pattern - always return the existing instance
        if (ApiService.instance) {
            return ApiService.instance;
        }

        // Initialize available instances
        this.availableInstances = DEFAULT_API_INSTANCES.map(instance => ({
            ...instance,
            // Make sure URL doesn't have protocol
            url: this.stripProtocol(instance.url)
        }));

        // Default to the first default instance if none provided
        this.currentApiInstance = apiInstance ||
            this.availableInstances.find(i => i.isDefault) ||
            this.availableInstances[0];

        // Set the static instance to this instance
        ApiService.instance = this;

        console.log("API Service initialized with instance:", this.currentApiInstance);
    }

    /**
     * Strip protocol from URL if present
     */
    private stripProtocol(url: string): string {
        return url.replace(/^https?:\/\//, '');
    }

    /**
     * Get the current API instance
     */
    getCurrentApiInstance(): ApiInstance {
        return this.currentApiInstance;
    }

    /**
     * Set the current API instance
     */
    setCurrentApiInstance(instance: ApiInstance): void {
        // Make sure URL doesn't have protocol
        const newUrl = this.stripProtocol(instance.url);
        const oldUrl = this.currentApiInstance.url;

        this.currentApiInstance = {
            ...instance,
            url: newUrl
        };

        console.log(`API instance set to: ${this.currentApiInstance.name} (${this.currentApiInstance.url})`);

        // Do NOT clear the cache when changing instances
        // The cache will be maintained for the duration of the session
        // unless explicitly cleared via clearCreatorsCache
    }

    /**
     * Get all available API instances
     */
    getAvailableInstances(): ApiInstance[] {
        return this.availableInstances;
    }

    /**
     * Add a custom API instance
     */
    addApiInstance(instance: ApiInstance): void {
        // Strip protocol if present
        const normalizedInstance = {
            ...instance,
            url: this.stripProtocol(instance.url)
        };

        // Check if already exists
        const exists = this.availableInstances.some(i => i.url === normalizedInstance.url);
        if (!exists) {
            this.availableInstances.push(normalizedInstance);
        }
    }

    /**
     * Validate an API instance by testing if it can fetch creators
     * @param instance The instance to validate
     * @returns Promise with validation result
     */
    async validateApiInstance(instance: ApiInstance): Promise<{ isValid: boolean; error?: string }> {
        const previousInstance = this.currentApiInstance;

        try {
            // Temporarily set the instance to test
            this.setCurrentApiInstance(instance);

            // Try to fetch creators as a test
            const response = await this.getAllCreators();

            if (response.error) {
                return { isValid: false, error: response.error };
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        } finally {
            // Restore the previous instance
            this.setCurrentApiInstance(previousInstance);
        }
    }

    /**
     * Clear the creators cache for the current domain or all domains
     * @param allDomains Whether to clear cache for all domains
     */
    clearCreatorsCache(allDomains: boolean = false): void {
        if (allDomains) {
            console.log('Clearing creators cache for all domains');
            ApiService.creatorsCache = {};
        } else {
            const domain = this.getDomain();
            console.log(`Clearing creators cache for domain: ${domain}`);
            delete ApiService.creatorsCache[domain];
        }
    }

    /**
     * Clear all caches for all domains
     * This is useful for troubleshooting or when switching between instances
     */
    clearAllCaches(): void {
        console.log('Clearing all caches for all domains');
        ApiService.creatorsCache = {};
    }

    /**
     * Gets the domain for the current API instance
     */
    private getDomain(): string {
        return this.currentApiInstance.url;
    }

    /**
     * Gets the full URL for the API (using proxy)
     */
    private getApiBaseUrl(): string {
        const domain = this.getDomain();
        return `/api/${domain}`;
    }

    /**
     * Gets the base URL for images
     */
    private getImageBaseUrl(): string {
        const domain = this.getDomain();
        console.log(`Using domain for images: ${domain} (from instance ${this.currentApiInstance.name})`);
        return `https://img.${domain}`;
    }

    /**
     * Fetches all creators from the API
     * @returns Promise with array of creators
     */
    async getAllCreators(): Promise<ApiResponse<Creator[]>> {
        const domain = this.getDomain();
        const now = Date.now();

        // Check if we have a valid cache entry
        if (ApiService.creatorsCache[domain] && ApiService.creatorsCache[domain].data) {
            console.log(`Using cached creators data for ${domain} - cache is valid`);
            return { data: ApiService.creatorsCache[domain].data };
        }

        // Check if we're already fetching data for this domain
        if (ApiService.creatorsCache[domain] && ApiService.creatorsCache[domain].data === null) {
            console.log(`Request for ${domain} already in progress, waiting...`);
            // Wait for the request to complete (poll every 100ms for up to 10 seconds)
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;

                if (ApiService.creatorsCache[domain] && ApiService.creatorsCache[domain].data) {
                    console.log(`Concurrent request completed, using cached data for ${domain}`);
                    return { data: ApiService.creatorsCache[domain].data };
                }

                if (ApiService.creatorsCache[domain] && ApiService.creatorsCache[domain].error) {
                    console.log(`Concurrent request failed for ${domain}`);
                    return { error: ApiService.creatorsCache[domain].error };
                }
            }

            // If we get here, something went wrong with the concurrent request
            console.error(`Timed out waiting for concurrent request for ${domain}`);
        }

        try {
            console.log(`Fetching creators.txt from API for domain: ${domain}`);

            // Create cache entry to indicate request in progress
            ApiService.creatorsCache[domain] = {
                data: null,
                error: null,
                timestamp: now
            };

            const baseUrl = this.getApiBaseUrl();
            const url = `${baseUrl}${ApiPath.CREATORS}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: CreatorsResponse = await response.json();

            // Cache the results
            ApiService.creatorsCache[domain] = {
                data,
                error: null,
                timestamp: now
            };

            console.log(`Successfully fetched and cached creators data for ${domain}`);
            return { data };
        } catch (error) {
            console.error(`Error fetching creators for ${domain}:`, error);

            // Cache the error
            ApiService.creatorsCache[domain] = {
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: now
            };

            return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
        }
    }

    /**
     * Fetches a specific creator by service and ID
     * @param service The service of the creator
     * @param id The creator's ID
     * @returns Promise with creator information
     */
    async getCreator(service: string, id: string): Promise<ApiResponse<Creator>> {
        try {
            // First try to get from all creators
            const allCreatorsResponse = await this.getAllCreators();

            if (allCreatorsResponse.data) {
                const creator = allCreatorsResponse.data.find(
                    c => c.service === service && c.id === id
                );

                if (creator) {
                    return { data: creator };
                }
            }

            // If not found, try to get profile which might have more details
            const profileResponse = await this.getCreatorProfile(service, id);
            if (profileResponse.data) {
                // Convert profile to creator format
                const creator: Creator = {
                    id,
                    service,
                    name: profileResponse.data.name || id,
                    favorited: profileResponse.data.favorited || 0,
                    updated: profileResponse.data.updated || 0,
                    indexed: profileResponse.data.indexed || 0,
                    links: profileResponse.data.links
                };
                return { data: creator };
            }

            return { error: 'Creator not found' };
        } catch (error) {
            console.error(`Error fetching creator ${service}/${id}:`, error);
            return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
        }
    }

    /**
     * Fetches profile information for a specific creator
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @returns Promise with creator profile information
     */
    async getCreatorProfile(platform: string, name: string): Promise<ApiResponse<CreatorProfile>> {
        try {
            const baseUrl = this.getApiBaseUrl();
            const url = `${baseUrl}${ApiPath.CREATOR_PROFILE
                .replace('{platform}', platform)
                .replace('{name}', name)}`;

            console.log(`Fetching creator profile from: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: ProfileResponse = await response.json();
            console.log('Raw profile data:', data);

            // Validate the data and provide defaults for missing fields
            const profile: CreatorProfile = {
                id: data.id || name,
                name: data.name || name,
                service: data.service || platform,
                favorited: typeof data.favorited === 'number' ? data.favorited : 0,
                updated: typeof data.updated === 'number' ? data.updated : Math.floor(Date.now() / 1000),
                indexed: typeof data.indexed === 'number' ? data.indexed : undefined,
                links: Array.isArray(data.links) ? data.links : [],
                description: data.description || ''
            };

            return { data: profile };
        } catch (error) {
            console.error(`Error fetching profile for ${platform}/${name}:`, error);

            // Return a default profile object in case of error
            const defaultProfile: CreatorProfile = {
                id: name,
                name: name,
                service: platform,
                favorited: 0,
                updated: Math.floor(Date.now() / 1000),
                links: [],
                description: ''
            };

            return {
                data: defaultProfile,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Fetches posts for a specific creator using the legacy endpoint
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @param offset Optional offset for pagination
     * @param limit Optional limit for pagination
     * @returns Promise with creator's posts
     */
    async getCreatorPosts(platform: string, name: string, offset: number = 0, limit: number = 50): Promise<ApiResponse<LegacyPost[]>> {
        try {
            const baseUrl = this.getApiBaseUrl();
            const url = `${baseUrl}${ApiPath.CREATOR_POSTS_LEGACY
                .replace('{platform}', platform)
                .replace('{name}', name)}?o=${offset}&l=${limit}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // The legacy API returns data in a different format
            const responseData: PostsLegacyResponse = await response.json();

            // Extract posts from the results array
            const posts: LegacyPost[] = responseData.results || [];

            // Map the result_previews, result_attachments, and result_is_image to the posts if they exist
            if (responseData.result_previews && responseData.result_previews.length > 0) {
                posts.forEach((post, index) => {
                    if (responseData.result_previews && responseData.result_previews[index]) {
                        // Store previews in a temporary field for later use
                        post._previews = responseData.result_previews[index];
                    }
                });
            }

            if (responseData.result_attachments && responseData.result_attachments.length > 0) {
                posts.forEach((post, index) => {
                    if (responseData.result_attachments && responseData.result_attachments[index]) {
                        // Store attachments in a temporary field for later use
                        post._attachments = responseData.result_attachments[index];
                    }
                });
            }

            if (responseData.result_is_image && responseData.result_is_image.length > 0) {
                posts.forEach((post, index) => {
                    if (responseData.result_is_image) {
                        // Store is_image flag in a temporary field for later use
                        post._is_image = responseData.result_is_image[index];
                    }
                });
            }

            return { data: posts };
        } catch (error) {
            console.error(`Error fetching posts for ${platform}/${name}:`, error);
            return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
        }
    }

    /**
     * Fetches a specific post by platform, creator name, and post ID
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @param postId The post ID
     * @returns Promise with complete post response
     */
    async getPost(platform: string, name: string, postId: string): Promise<ApiResponse<PostResponse>> {
        try {
            const baseUrl = this.getApiBaseUrl();
            const url = `${baseUrl}${ApiPath.POST
                .replace('{platform}', platform)
                .replace('{name}', name)
                .replace('{postId}', postId)}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: PostResponse = await response.json();
            return { data };
        } catch (error) {
            console.error(`Error fetching post ${platform}/${name}/${postId}:`, error);
            return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
        }
    }

    /**
     * Gets the URL for a creator's profile picture
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @returns URL to the profile picture
     */
    getProfilePictureUrl(platform: string, name: string): string {
        if (!platform || !name) return '';
        const baseUrl = this.getImageBaseUrl();
        console.log(`Creating profile picture URL with base: ${baseUrl}`);
        return `${baseUrl}/icons/${platform}/${name}`;
    }

    /**
     * Gets the URL for a creator's banner image
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @returns URL to the banner image
     */
    getBannerUrl(platform: string, name: string): string {
        if (!platform || !name) return '';
        const baseUrl = this.getImageBaseUrl();
        return `${baseUrl}/banners/${platform}/${name}`;
    }

    /**
     * Gets the URL for a file
     * @param path The path to the file
     * @param server Optional server URL for videos
     * @param type Optional file type (e.g., 'thumbnail')
     * @returns URL to the file
     */
    getFileUrl(path: string, server?: string, type: string = 'thumbnail'): string {
        if (!path) return '';
        // Make sure path starts with a slash
        const formattedPath = path.startsWith('/') ? path : `/${path}`;

        // Check if it's a video (mp4, etc.)
        const isVideo = formattedPath.match(/\.(mp4|webm|mov|avi|wmv)$/i) !== null;

        if (isVideo) {
            // For videos, use the server if available
            if (server) {
                return `${server}/data${formattedPath}`;
            }
            // If no server provided, use the current domain
            const domain = this.getDomain();
            return `https://${domain}/data${formattedPath}`;
        } else {
            // For images, use the direct image URL with the specified type (thumbnail, attachment, etc.)
            const baseUrl = this.getImageBaseUrl();

            // For images, we should generally prefer 'thumbnail' for better loading performance
            // unless explicitly requesting a different type
            const urlType = type || 'thumbnail';

            // Log the URL being constructed for debugging
            const imageUrl = `${baseUrl}/${urlType}/data${formattedPath}`;
            console.log(`Constructing image URL: ${imageUrl} (type: ${urlType})`);

            return imageUrl;
        }
    }

    /**
     * Gets the thumbnail URL for a file
     * @param path The path to the file
     * @param server Optional server URL for videos
     * @returns URL to the thumbnail
     */
    getThumbnailUrl(path: string, server?: string): string {
        if (!path) return '';
        // Make sure path starts with a slash
        const formattedPath = path.startsWith('/') ? path : `/${path}`;

        // Check if it's a video
        const isVideo = formattedPath.match(/\.(mp4|webm|mov|avi|wmv)$/i) !== null;

        if (isVideo) {
            // For videos, use the server if available
            if (server) {
                return `${server}/data${formattedPath}`;
            }
            // If no server provided, use the current domain
            const domain = this.getDomain();
            return `https://${domain}/data${formattedPath}`;
        }

        // For images, always use the thumbnail type
        const baseUrl = this.getImageBaseUrl();
        const thumbnailUrl = `${baseUrl}/thumbnail/data${formattedPath}`;
        console.log(`Constructing thumbnail URL: ${thumbnailUrl}`);
        return thumbnailUrl;
    }
}