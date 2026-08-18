import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

import {Sidebar} from '../suites/sidebar/Sidebar';

const toggleSetting = async (
    page: Page,
    state: 'on' | 'off',
    title: string,
    openSettingsPage: (sidebar: Sidebar) => Promise<void>,
) => {
    const sidebar = new Sidebar(page);
    await sidebar.waitForSidebarToLoad();
    if (!(await sidebar.isDrawerVisible())) {
        await sidebar.clickSettings();
    }
    await openSettingsPage(sidebar);
    const currentState = await sidebar.isExperimentEnabled(title);
    const desiredState = state === 'on';

    if (currentState !== desiredState) {
        await sidebar.toggleExperimentByTitle(title);
        await expect.poll(() => sidebar.isExperimentEnabled(title)).toBe(desiredState);
    }

    if (await sidebar.isDrawerVisible()) {
        await sidebar.closeDrawer();
    }
};

export const toggleExperiment = (page: Page, state: 'on' | 'off', title: string) => {
    return toggleSetting(page, state, title, (sidebar) => sidebar.clickExperimentsSection());
};

export const toggleEditorSetting = (page: Page, state: 'on' | 'off', title: string) => {
    return toggleSetting(page, state, title, (sidebar) => sidebar.clickEditorSection());
};
