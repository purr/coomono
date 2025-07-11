// Types for Creator API responses

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