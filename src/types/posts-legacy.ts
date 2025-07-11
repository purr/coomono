// Types for Legacy Posts API responses

import type { Post } from './posts';
import type { Preview, Attachment } from './posts';

/**
 * Legacy API response for posts
 */
export interface PostsLegacyResponse {
    props: {
        currentPage: string;
        id: string;
        service: string;
        name: string;
        count: number;
        limit: number;
        artist: {
            id: string;
            name: string;
            service: string;
            indexed: string;
            updated: string;
            public_id: string;
            relation_id: string | null;
        };
        display_data: {
            service: string;
            href: string;
        };
        dm_count: number;
        share_count: number;
        has_links: string;
    };
    base: {
        service: string;
        artist_id: string;
    };
    results: Post[];
    result_previews?: Preview[][];
    result_attachments?: Attachment[][];
    result_is_image?: boolean[];
    disable_service_icons: boolean;
}

/**
 * Extended Post interface with temporary fields for legacy API
 */
export interface LegacyPost extends Post {
    _previews?: Preview[];
    _attachments?: Attachment[];
    _is_image?: boolean;
}
