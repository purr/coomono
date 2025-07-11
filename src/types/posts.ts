// Types for Post API responses

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