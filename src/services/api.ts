import { ApiEndpoint, Service } from '../types/api';
import type { ApiResponse, Creator, CreatorProfile, Post } from '../types/api';

/**
 * API service for interacting with coomer.su and kemono.su
 */
export class ApiService {
    private coomerBaseUrl: string = '/coomer-api'; // Using proxy path instead of direct URL
    private kemonoBaseUrl: string = '/kemono-api'; // Using proxy path instead of direct URL
    private imageProxyUrl: string = '/img-proxy'; // Using proxy path for images

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
     * Fetches posts for a specific creator
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @returns Promise with creator's posts
     */
    async getCreatorPosts(platform: string, name: string): Promise<ApiResponse<Post[]>> {
        try {
            // Determine whether to use coomer.su or kemono.su based on the platform
            const baseUrl = this.getBaseUrlForPlatform(platform);
            const url = `${baseUrl}${ApiEndpoint.CREATOR_POSTS
                .replace('{platform}', platform)
                .replace('{name}', name)}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data: Post[] = await response.json();
            return { data };
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
        return `${this.imageProxyUrl}/icons/${platform}/${name}`;
    }

    /**
     * Gets the URL for a creator's banner image
     * @param platform The platform/service of the creator
     * @param name The creator's name/id
     * @returns URL to the banner image
     */
    getBannerUrl(platform: string, name: string): string {
        return `${this.imageProxyUrl}/banners/${platform}/${name}`;
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