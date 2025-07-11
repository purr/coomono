import { ApiEndpoint, Service } from '../types/api';
import type { ApiResponse, Creator, CreatorProfile, Post, File } from '../types/api';

/**
 * API service for interacting with coomer.su and kemono.su
 */
export class ApiService {
    private coomerBaseUrl: string = '/coomer-api'; // Using proxy path instead of direct URL
    private kemonoBaseUrl: string = '/kemono-api'; // Using proxy path instead of direct URL
    private imageProxyUrl: string = '/img-proxy'; // Using proxy path for images
    private dataProxyUrl: string = '/img-proxy/data'; // Using proxy path for data files

    /**
     * Fetches all creators from the API
     * @returns Promise with an array of creators
     */
    async getAllCreators(): Promise<ApiResponse<Creator[]>> {
        try {
            // Use coomer.su endpoint, which should contain all creators
            const response = await fetch(`${this.coomerBaseUrl}${ApiEndpoint.CREATORS}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data: Creator[] = await response.json();
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
            // Determine whether to use coomer.su or kemono.su based on the platform
            const baseUrl = this.getBaseUrlForPlatform(platform);
            const url = `${baseUrl}${ApiEndpoint.CREATOR_PROFILE
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
            // Determine whether to use coomer.su or kemono.su based on the platform
            const baseUrl = this.getBaseUrlForPlatform(platform);
            const url = `${baseUrl}${ApiEndpoint.CREATOR_POSTS_LEGACY
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
        return `${this.imageProxyUrl}/icons/${platform}/${name}`;
    }

    /**
     * Gets the URL for a creator's banner image
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @returns URL to the banner image
     */
    getBannerUrl(platform: string, name: string): string {
        if (!platform || !name) return '';
        return `${this.imageProxyUrl}/banners/${platform}/${name}`;
    }

    /**
     * Gets the URL for a file
     * @param path The path to the file
     * @returns URL to the file
     */
    getFileUrl(path: string): string {
        if (!path) return '';
        // Make sure path starts with a slash
        const formattedPath = path.startsWith('/') ? path : `/${path}`;
        return `${this.dataProxyUrl}${formattedPath}`;
    }

    /**
     * Gets the thumbnail URL for a file
     * @param path The path to the file
     * @returns URL to the thumbnail
     */
    getThumbnailUrl(path: string): string {
        if (!path) return '';
        // Make sure path starts with a slash
        const formattedPath = path.startsWith('/') ? path : `/${path}`;

        // For videos, we might want to append a thumbnail parameter
        if (formattedPath.match(/\.(mp4|webm|mov|avi|wmv)$/i)) {
            return `${this.dataProxyUrl}${formattedPath}?thumbnail=1`;
        }
        return this.getFileUrl(formattedPath);
    }

    /**
     * Determines the appropriate base URL based on the platform
     * @param platform The platform/service
     * @returns The base URL for the API
     */
    private getBaseUrlForPlatform(platform: string): string {
        // OnlyFans and Fansly are on coomer.su, others on kemono.su
        switch (platform) {
            case Service.ONLYFANS:
            case Service.FANSLY:
                return this.coomerBaseUrl;
            default:
                return this.kemonoBaseUrl;
        }
    }
}