// Common types for API responses

/**
 * File object for attachments
 */
export interface File {
    id?: string; // Generated client-side
    name: string;
    path: string;
    hash?: string;
    size?: number;
    added?: number;
    type?: string;
    width?: number;
    height?: number; // For videos
    duration?: number; // For videos
}

/**
 * Default API endpoints
 */
export interface ApiInstance {
    name: string;
    url: string;
    isDefault?: boolean;
}

export const DEFAULT_API_INSTANCES: ApiInstance[] = [
    { name: "Coomer", url: "coomer.su", isDefault: true },
    { name: "Kemono", url: "kemono.su", isDefault: true }
];

/**
 * API endpoint paths
 */
export const ApiPath = {
    // List of all creators
    CREATORS: "/api/v1/creators.txt",

    // Profile of a specific creator
    CREATOR_PROFILE: "/api/v1/{platform}/user/{name}/profile",

    // Posts of a specific creator (new legacy endpoint)
    CREATOR_POSTS_LEGACY: "/api/v1/{platform}/user/{name}/posts-legacy",

    // Posts of a specific creator (old endpoint)
    CREATOR_POSTS: "/api/v1/{platform}/user/{name}/posts",

    // Single post endpoint
    POST: "/api/v1/{platform}/user/{name}/post/{postId}",
} as const;

/**
 * Media types used in the app
 */
export const MediaType = {
    PROFILE_PICTURE: "profile",
    BANNER: "banner",
    ATTACHMENT: "attachment",
    EMBED: "embed",
} as const;

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}