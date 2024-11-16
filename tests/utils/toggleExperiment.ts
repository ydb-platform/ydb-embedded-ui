import type {Page} from '@playwright/test';

import {Sidebar} from '../suites/sidebar/Sidebar';

export const toggleExperiment = async (page: Page, state: 'on' | 'off', title: string) => {
    const sidebar = new Sidebar(page);
    await sidebar.waitForSidebarToLoad();
    if (!(await sidebar.isDrawerVisible())) {
        await sidebar.clickSettings();
        await page.waitForTimeout(500); // Wait for animation
    }
    await sidebar.clickExperimentsSection();
    await page.waitForTimeout(500); // Wait for animation
    const currentState = await sidebar.isExperimentEnabled(title);
    const desiredState = state === 'on';

    if (currentState !== desiredState) {
        await sidebar.toggleExperimentByTitle(title);
        await page.waitForTimeout(500); // Wait for animation
    }

    if (await sidebar.isDrawerVisible()) {
        await sidebar.clickSettings();
        await page.waitForTimeout(500); // Wait for animation
    }
};
