import type {Locator} from '@playwright/test';

/**
 * Checks if an element is within the viewport
 * @param locator - Playwright locator for the element to check
 * @returns Promise<boolean> - true if the element is within viewport bounds
 */
export const isInViewport = async (locator: Locator): Promise<boolean> => {
    return locator.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    });
};
