import {getSvgViewerDocument} from '../components/ExecutionPlan/svgViewer';

test('isolates the exact SVG document while allowing its local controls and styles', () => {
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><title>&lt;/iframe&gt; ☃</title><script>void 0</script></svg>';
    const viewer = new DOMParser().parseFromString(
        getSvgViewerDocument(svg, 'Execution <Plan>'),
        'text/html',
    );
    expect(viewer.title).toBe('Execution <Plan>');
    expect(viewer.querySelectorAll('iframe')).toHaveLength(1);
    expect(viewer.querySelectorAll('script')).toHaveLength(0);
    const frame = viewer.querySelector('iframe');
    expect(frame?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame?.getAttribute('src')).toBe(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
    expect(
        viewer.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content'),
    ).toBe(
        "default-src 'none'; frame-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
    );
});
