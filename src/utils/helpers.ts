/**
 * Formats a timestamp into a human-readable date
 * @param timestamp The timestamp to format
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Formats a timestamp into a human-readable date with time
 * @param timestamp The timestamp to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Truncates a string if it exceeds the specified length
 * @param str The string to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string with ellipsis or original string
 */
export const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength)}...`;
};

/**
 * Safely parses JSON without throwing errors
 * @param jsonString The JSON string to parse
 * @returns Parsed object or null if invalid
 */
export const safeJsonParse = (jsonString: string): unknown => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
};

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (...args: Parameters<T>): void {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout !== null) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(later, wait);
    };
};

/**
 * Handles link interaction with support for:
 * - Middle click to open in new tab
 * - Right click for context menu
 * - Copy link address
 *
 * @param url The URL to navigate to or copy
 * @param onClick Optional click handler
 * @param startLoading Optional function to trigger loading state
 * @returns Event handler functions
 */
export const handleLinkInteraction = (
    url: string,
    onClick?: (e: React.MouseEvent) => void,
    startLoading?: () => void
) => {
    const handleClick = (e: React.MouseEvent) => {
        // Allow middle click to work naturally (browser handles opening in new tab)
        if (e.button === 1) return;

        // For left click, always prevent the default navigation
        e.preventDefault();

        // For left click, start the loading state if provided
        if (startLoading) {
            startLoading();
        }

        // Call the onClick handler if provided
        if (onClick) onClick(e);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        // Right click - allow default browser context menu
        // The browser's context menu will show options including "Open in new tab" and "Copy link address"
        // We don't need to do anything special here, as the browser handles it
    };

    const handleAuxClick = (e: React.MouseEvent) => {
        // This is for middle mouse button click
        // We don't need to do anything special as the browser will handle opening in a new tab
        // as long as we don't prevent the default behavior
    };

    return {
        onClick: handleClick,
        onContextMenu: handleContextMenu,
        onAuxClick: handleAuxClick,
    };
};