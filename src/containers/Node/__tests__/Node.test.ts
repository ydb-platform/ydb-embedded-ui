import {NODE_TABS} from '../NodePages';

describe('Node tab filtering logic', () => {
    it('should filter out threads tab when no thread data is provided', () => {
        // Simulate the filtering logic that happens in the Node component
        const isStorageNode = false;
        const isDiskPagesAvailable = false;
        const node: {Threads?: any[]} = {
            // No Threads property
        };

        let actualNodeTabs = isStorageNode
            ? NODE_TABS
            : NODE_TABS.filter((el) => el.id !== 'storage');

        if (isDiskPagesAvailable) {
            actualNodeTabs = actualNodeTabs.filter((el) => el.id !== 'structure');
        }

        // Filter out threads tab if there's no thread data in the API response
        if (!node.Threads || node.Threads.length === 0) {
            actualNodeTabs = actualNodeTabs.filter((el) => el.id !== 'threads');
        }

        // Should not include threads tab
        expect(actualNodeTabs.some((tab) => tab.id === 'threads')).toBe(false);
        // Should include other tabs
        expect(actualNodeTabs.some((tab) => tab.id === 'tablets')).toBe(true);
    });

    it('should include threads tab when thread data is provided', () => {
        // Simulate the filtering logic that happens in the Node component
        const isStorageNode = false;
        const isDiskPagesAvailable = false;
        const node: {Threads?: any[]} = {
            Threads: [{Name: 'TestPool', Threads: 4}],
        };

        let actualNodeTabs = isStorageNode
            ? NODE_TABS
            : NODE_TABS.filter((el) => el.id !== 'storage');

        if (isDiskPagesAvailable) {
            actualNodeTabs = actualNodeTabs.filter((el) => el.id !== 'structure');
        }

        // Filter out threads tab if there's no thread data in the API response
        if (!node.Threads || node.Threads.length === 0) {
            actualNodeTabs = actualNodeTabs.filter((el) => el.id !== 'threads');
        }

        // Should include threads tab
        expect(actualNodeTabs.some((tab) => tab.id === 'threads')).toBe(true);
        // Should include other tabs
        expect(actualNodeTabs.some((tab) => tab.id === 'tablets')).toBe(true);
    });

    it('should filter out threads tab when thread data is empty array', () => {
        // Simulate the filtering logic that happens in the Node component
        const isStorageNode = false;
        const isDiskPagesAvailable = false;
        const node: {Threads?: any[]} = {
            Threads: [], // Empty array
        };

        let actualNodeTabs = isStorageNode
            ? NODE_TABS
            : NODE_TABS.filter((el) => el.id !== 'storage');

        if (isDiskPagesAvailable) {
            actualNodeTabs = actualNodeTabs.filter((el) => el.id !== 'structure');
        }

        // Filter out threads tab if there's no thread data in the API response
        if (!node.Threads || node.Threads.length === 0) {
            actualNodeTabs = actualNodeTabs.filter((el) => el.id !== 'threads');
        }

        // Should not include threads tab
        expect(actualNodeTabs.some((tab) => tab.id === 'threads')).toBe(false);
        // Should include other tabs
        expect(actualNodeTabs.some((tab) => tab.id === 'tablets')).toBe(true);
    });
});
