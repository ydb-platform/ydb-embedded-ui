const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const paletteTokens = {
    '--stage-main': '--g-color-base-generic',
    '--stage-clone': '--g-color-base-generic-accent',
    '--stage-text': '--g-color-text-primary',
    '--stage-texthl': '--g-color-text-danger',
    '--stage-grid': '--g-color-line-generic',
    '--column-header': '--g-color-base-generic-hover',
    '--conn-fill': '--g-color-base-generic-accent',
    '--conn-line': '--g-color-line-generic-accent',
    '--conn-text': '--g-color-text-complementary',
    '--text-summary': '--g-color-text-primary',
} as const;

type Palette = Partial<Record<keyof typeof paletteTokens, string>>;

export function getSvgPalette(container: Element): Palette {
    const styles = getComputedStyle(container);
    return Object.fromEntries(
        Object.entries(paletteTokens).map(([name, token]) => [
            name,
            styles.getPropertyValue(token).trim(),
        ]),
    );
}

export function themeSvg(svg: string, palette: Palette): string {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = document.documentElement;
    if (
        document.getElementsByTagName('parsererror').length ||
        root.localName !== 'svg' ||
        root.namespaceURI !== SVG_NAMESPACE
    ) {
        throw new Error('Invalid execution plan SVG');
    }
    const declarations = Object.keys(paletteTokens).flatMap((name) => {
        const value = palette[name as keyof Palette];
        return value && new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(svg)
            ? [`${name}: ${value};`]
            : [];
    });
    if (!declarations.length) {
        return svg;
    }
    const style = document.createElementNS(SVG_NAMESPACE, 'style');
    style.setAttribute('id', 'ydb-query-plan-palette');
    style.textContent = `:root {${declarations.join('')}}`;
    root.insertBefore(style, root.firstChild);
    return new XMLSerializer().serializeToString(document);
}
