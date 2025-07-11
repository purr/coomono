// Types for Post API responses

/**
 * Post object from a creator
 */
export interface Post {
    id: string;
    user: string;
    service: string;
    title: string;
    content?: string;
    embed?: object;
    shared_file?: boolean;
    added?: string;
    published: string; // ISO date string
    edited?: string | null;
    file?: {
        name: string;
        path: string;
    };
    attachments?: {
        name: string;
        path: string;
    }[];
    poll?: any | null;
    captions?: any | null;
    tags?: any | null;
    next?: string | null;
    prev?: string | null;
}

/**
 * Attachment object from the API response
 */
export interface Attachment {
    server: string;
    name: string;
    extension: string;
    name_extension: string;
    stem: string;
    path: string;
}

/**
 * Preview object from the API response
 */
export interface Preview {
    type: string;
    server: string;
    name: string;
    path: string;
}

/**
 * Video object from the API response
 */
export interface Video {
    index: number;
    path: string;
    name: string;
    extension: string;
    name_extension: string;
    server: string;
}

/**
 * Props object from the API response
 * This can vary, but typically includes flagged and revisions
 */
export interface Props {
    flagged: any | null;
    revisions?: any[][];
    [key: string]: any; // Allow for additional properties
}

/**
 * Complete API response for a single post
 */
export interface PostResponse {
    post: Post;
    attachments: Attachment[];
    previews: Preview[];
    videos: Video[];
    props: Props;
}
