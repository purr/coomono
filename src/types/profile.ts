import type { Link } from "./creators";

// Types for Creator Profile API responses

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