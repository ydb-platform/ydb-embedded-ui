import {getSvgPalette, themeSvg} from '../components/ExecutionPlan/svgTheme';

const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="99" viewBox="0 0 1280 99"><g transform="translate(12, 4)"><rect x="4" width="90" fill="var(--stage-main, #F2F2F2)"/><text fill="var(--stage-text, #262626)">ResultSet &amp; Filter</text><rect fill="var(--cpu-main, green)" height="4"/></g></svg>';

test('adds only the allowed palette without changing geometry, labels or metric colors', () => {
    const result = themeSvg(svg, {'--stage-main': 'rgb(20, 20, 20)', '--stage-text': '#fff'});
    const parse = (value: string) => new DOMParser().parseFromString(value, 'image/svg+xml');
    const actual = parse(result);
    const style = actual.getElementById('ydb-query-plan-palette');
    expect(style?.textContent).toBe(':root {--stage-main: rgb(20, 20, 20);--stage-text: #fff;}');
    style?.remove();
    expect(actual.documentElement.isEqualNode(parse(svg).documentElement)).toBe(true);
    expect(result).toContain('var(--cpu-main, green)');
});

test('leaves legacy SVG and unknown palette properties unchanged', () => {
    const legacy = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M0 0h10"/></svg>';
    expect(themeSvg(legacy, {'--stage-main': '#000'})).toBe(legacy);
    expect(themeSvg(svg, {})).toBe(svg);
});

test.each(['', '<svg><broken></svg>', '<html/>', '<svg/>'])('rejects invalid SVG %s', (value) =>
    expect(() => themeSvg(value, {})).toThrow('Invalid execution plan SVG'),
);

test('reads Gravity tokens from the supplied container', () => {
    const container = document.createElement('div');
    container.style.setProperty('--g-color-base-generic', '#123456');
    container.style.setProperty('--g-color-text-primary', '#abcdef');
    document.body.append(container);
    expect(getSvgPalette(container)).toMatchObject({
        '--stage-main': '#123456',
        '--stage-text': '#abcdef',
    });
    container.remove();
});
