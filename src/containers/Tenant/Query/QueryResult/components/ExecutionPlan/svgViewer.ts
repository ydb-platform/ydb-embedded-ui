export function getSvgViewerDocument(svg: string, title: string): string {
    const viewer = document.implementation.createHTMLDocument(title);
    const policy = viewer.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    // Data documents inherit this policy; scripts can operate the plan, but cannot use the network.
    policy.content =
        "default-src 'none'; frame-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";
    viewer.head.prepend(policy);
    viewer.body.style.margin = '0';
    const frame = viewer.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.title = title;
    frame.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    frame.style.cssText = 'display: block; width: 100vw; height: 100vh; border: 0;';
    viewer.body.append(frame);
    return `<!doctype html>${viewer.documentElement.outerHTML}`;
}
