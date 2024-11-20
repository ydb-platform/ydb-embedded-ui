import {expect, test} from '@playwright/test';

test('test 1 - this will remain unchanged', async () => {
    expect(true).toBeTruthy();
});

test.skip('test 2 - this will be skipped later', async () => {
    expect(true).toBeTruthy();
});

// test 3 has been removed
