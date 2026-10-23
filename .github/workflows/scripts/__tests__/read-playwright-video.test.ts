import {readPlaywrightVideo} from '../read-playwright-video';

describe('readPlaywrightVideo', () => {
    test.each([
        ['plain', 'retain-on-failure'],
        ['single quotes', "'retain-on-failure'"],
        ['double quotes', '"retain-on-failure"'],
        ['trailing spaces', 'retain-on-failure   '],
        ['extra spacing', '  retain-on-failure\t '],
        ['inline comment', 'retain-on-failure # keep recordings'],
        ['single quotes and comment', "'retain-on-failure'  # keep recordings"],
        ['double quotes and comment', '"retain-on-failure"\t# keep recordings'],
    ])('reads the video mode with %s', (_, value) => {
        const workflow = `env:\n  PLAYWRIGHT_VIDEO: ${value}\n  CI: 'true'\n`;
        expect(readPlaywrightVideo(workflow)).toBe('retain-on-failure');
    });

    test('reads CRLF line endings', () => {
        expect(readPlaywrightVideo('env:\r\n  PLAYWRIGHT_VIDEO: "retain-on-failure"\r\n')).toBe(
            'retain-on-failure',
        );
    });

    test.each(['off', 'on', 'on-first-retry'])('preserves the configured %s mode', (mode) => {
        expect(readPlaywrightVideo(`  PLAYWRIGHT_VIDEO: ${mode}\n`)).toBe(mode);
    });

    test.each([
        ['missing key', "env:\n  CI: 'true'\n"],
        ['commented key', '  # PLAYWRIGHT_VIDEO: retain-on-failure\n'],
        ['empty value', '  PLAYWRIGHT_VIDEO: \n  CI: true\n'],
        ['comment only', '  PLAYWRIGHT_VIDEO: # retain-on-failure\n'],
        ['empty quotes', "  PLAYWRIGHT_VIDEO: ''\n"],
        ['unclosed quote', "  PLAYWRIGHT_VIDEO: 'retain-on-failure\n"],
        ['mismatched quotes', '  PLAYWRIGHT_VIDEO: \'retain-on-failure"\n'],
        ['trailing content', '  PLAYWRIGHT_VIDEO: "retain-on-failure" extra\n'],
        ['hash inside value', '  PLAYWRIGHT_VIDEO: retain-on-failure#comment\n'],
    ])('does not read a video mode from %s', (_, workflow) => {
        expect(readPlaywrightVideo(workflow)).toBeUndefined();
    });
});
