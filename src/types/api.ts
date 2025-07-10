// Types for API responses from coomer.su and kemono.su

/**
 * Creator object returned from creators.txt endpoint
 */
export interface Creator {
    id: string;
    name: string;
    service: string;
    indexed: number;
    updated: number;
    favorited: number;
}

/**
 * Profile information of a creator
 */
export interface CreatorProfile {
    // Properties will be determined based on API response
    id: string;
    name: string;
    service: string;
    // Other properties to be determined
}

/**
 * Post object from a creator
 */
export interface Post {
    // Properties will be determined based on API response
    id: string;
    user: string;
    service: string;
    title: string;
    content: string;
    embed: object;
    shared_file: boolean;
    // Other properties to be determined
}

/**
 * API endpoints for coomer.su and kemono.su
 */
export const ApiEndpoint = {
    // Base URLs
    COOMER_BASE: "https://coomer.su/api/v1",
    KEMONO_BASE: "https://kemono.su/api/v1",

    // List of all creators
    CREATORS: "/creators.txt",

    // Profile of a specific creator
    CREATOR_PROFILE: "/{platform}/user/{name}/profile",

    // Posts of a specific creator
    CREATOR_POSTS: "/{platform}/user/{name}/posts",
} as const;

/**
 * Supported platforms/services
 */
export const Service = {
    ONLYFANS: "onlyfans",
    FANSLY: "fansly",
    PATREON: "patreon",
    FANBOX: "fanbox",
    DISCORD: "discord",
    FANTIA: "fantia",
    GUMROAD: "gumroad",
    SUBSCRIBESTAR: "subscribestar",
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
