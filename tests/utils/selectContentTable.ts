import type {Locator} from '@playwright/test';

// react-data-table has 2 table elements - for header and for the content
// so we select content table that is wrapped with .data-table__box
export const selectContentTable = (selector: Locator) => {
    return selector.locator('.data-table__box').getByRole('table');
};
