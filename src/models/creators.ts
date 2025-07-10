import type { Creator, CreatorProfile, Post } from '../types/api';

/**
 * Class to manage creators data and state
 */
export class CreatorsModel {
    private creators: Creator[] = [];
    private creatorProfiles: Map<string, CreatorProfile> = new Map();
    private creatorPosts: Map<string, Post[]> = new Map();

    /**
     * Sets the list of all creators
     * @param creators Array of creators
     */
    setCreators(creators: Creator[]): void {
        this.creators = creators;
    }

    /**
     * Gets the list of all creators
     * @returns Array of creators
     */
    getCreators(): Creator[] {
        return this.creators;
    }

    /**
     * Sets the profile for a specific creator
     * @param service The platform/service
     * @param id Creator ID
     * @param profile Creator profile data
     */
    setCreatorProfile(service: string, id: string, profile: CreatorProfile): void {
        const key = `${service}:${id}`;
        this.creatorProfiles.set(key, profile);
    }

    /**
     * Gets the profile for a specific creator
     * @param service The platform/service
     * @param id Creator ID
     * @returns Creator profile or undefined if not found
     */
    getCreatorProfile(service: string, id: string): CreatorProfile | undefined {
        const key = `${service}:${id}`;
        return this.creatorProfiles.get(key);
    }

    /**
     * Sets the posts for a specific creator
     * @param service The platform/service
     * @param id Creator ID
     * @param posts Array of creator posts
     */
    setCreatorPosts(service: string, id: string, posts: Post[]): void {
        const key = `${service}:${id}`;
        this.creatorPosts.set(key, posts);
    }

    /**
     * Gets the posts for a specific creator
     * @param service The platform/service
     * @param id Creator ID
     * @returns Array of creator posts or undefined if not found
     */
    getCreatorPosts(service: string, id: string): Post[] | undefined {
        const key = `${service}:${id}`;
        return this.creatorPosts.get(key);
    }

    /**
     * Searches creators based on a search term
     * @param searchTerm The search term
     * @returns Filtered array of creators
     */
    searchCreators(searchTerm: string): Creator[] {
        if (!searchTerm) return this.creators;

        const term = searchTerm.toLowerCase();
        return this.creators.filter(creator =>
            creator.name.toLowerCase().includes(term) ||
            creator.id.toLowerCase().includes(term) ||
            creator.service.toLowerCase().includes(term)
        );
    }

    /**
     * Gets creators from a specific platform/service
     * @param service The platform/service
     * @returns Filtered array of creators
     */
    getCreatorsByService(service: string): Creator[] {
        return this.creators.filter(creator => creator.service === service);
    }

    /**
     * Gets creators sorted by a specific property
     * @param sortBy Property to sort by
     * @param ascending Sort direction
     * @returns Sorted array of creators
     */
    getSortedCreators(
        sortBy: keyof Creator = 'updated',
        ascending: boolean = false
    ): Creator[] {
        return [...this.creators].sort((a, b) => {
            const valueA = a[sortBy];
            const valueB = b[sortBy];

            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });
    }
}