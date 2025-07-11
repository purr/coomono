import { ApiPath, DEFAULT_API_INSTANCES } from "../types/common";
import type { ApiResponse, ApiInstance } from '../types/common';
import type { Creator } from '../types/creators';
import type { CreatorProfile } from '../types/profile';
import type { Post } from '../types/posts';

/**
 * API service for interacting with kemono-style APIs
 */
export class ApiService {
    private static instance: ApiService;
    private currentApiInstance!: ApiInstance;
    private availableInstances: ApiInstance[] = [];

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
        this.currentApiInstance = {
            ...instance,
            url: this.stripProtocol(instance.url)
        };

        console.log(`API instance set to: ${this.currentApiInstance.name} (${this.currentApiInstance.url})`);

        // Clear any caches that might be using the old domain
        console.log('Domain updated - clearing any cached data');
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
     * @returns Promise with an array of creators
     */
    async getAllCreators(): Promise<ApiResponse<Creator[]>> {
        try {
            const baseUrl = this.getApiBaseUrl();
            const url = `${baseUrl}${ApiPath.CREATORS}`;

            console.log(`Fetching creators from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('Error fetching creators:', error);
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

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data: CreatorProfile = await response.json();
            return { data };
        } catch (error) {
            console.error(`Error fetching profile for ${platform}/${name}:`, error);
            return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
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
    async getCreatorPosts(platform: string, name: string, offset: number = 0, limit: number = 50): Promise<ApiResponse<Post[]>> {
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
            const responseData = await response.json();

            // Extract posts from the results array
            const posts: Post[] = responseData.results || [];

            return { data: posts };
        } catch (error) {
            console.error(`Error fetching posts for ${platform}/${name}:`, error);
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

        if (isVideo && server) {
            // For videos, ALWAYS use the server from the response and just "/data" in the path
            return `${server}/data${formattedPath}`;
        } else if (!isVideo) {
            // For images, use the direct image URL with the type
            const baseUrl = this.getImageBaseUrl();
            return `${baseUrl}/${type}/data${formattedPath}`;
        }

        // If we get here, it's a video without a server - this shouldn't happen
        // but we'll log a warning and use a placeholder
        console.warn('Video without server URL:', path);
        return `https://example.com/missing-server-url${formattedPath}`;
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

        if (isVideo && server) {
            // For videos, just return the server URL with data path - no thumbnail parameter
            // Videos don't support thumbnails directly
            return `${server}/data${formattedPath}`;
        } else if (isVideo) {
            // If we get here, it's a video without a server - this shouldn't happen
            console.warn('Video without server URL for thumbnail:', path);
            return `https://example.com/missing-server-url${formattedPath}`;
        }

        // For images, use the standard file URL with thumbnail type
        return this.getFileUrl(formattedPath, server, 'thumbnail');
    }
}