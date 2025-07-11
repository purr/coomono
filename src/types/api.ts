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
    links?: Link[];
}

/**
 * Social media link
 */
export interface Link {
    platform: string;
    url: string;
}

/**
 * Profile information of a creator
 */
export interface CreatorProfile {
    id: string;
    name: string;
    service: string;
    favorited: number;
    updated: number;
    indexed?: number;
    links?: Link[];
    description?: string;
}

/**
 * Post object from a creator (legacy API)
 */
export interface Post {
    id: string;
    user: string;
    service: string;
    title: string;
    content?: string;
    published: string; // ISO date string
    file?: {
        name: string;
        path: string;
    };
    attachments?: {
        name: string;
        path: string;
    }[];
    // Additional fields from legacy API
    substring?: string;
    added?: string;
    embed?: object;
    shared_file?: boolean;
    edited?: string | null;
    poll?: any | null;
    captions?: any | null;
    tags?: any | null;
}

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
    height?: number;
    duration?: number; // For videos
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

    // Posts of a specific creator (new legacy endpoint)
    CREATOR_POSTS_LEGACY: "/{platform}/user/{name}/posts-legacy",

    // Posts of a specific creator (old endpoint)
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
