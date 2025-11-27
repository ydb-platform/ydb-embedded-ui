declare module '*.svg' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const content: import('@gravity-ui/uikit').IconData;
    export default content;
}

// Type declaration for SVG imports with ?react query parameter.
// This is required for dynamic imports (import()) to ensure rsbuild's SVGR plugin
// processes SVG files as React components (IconData) rather than asset URLs.
// Static imports work without ?react, but dynamic imports need it explicitly.
// rsbuild svgr docs: https://rsbuild.rs/plugins/list/plugin-svgr#example
declare module '*.svg?react' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const content: import('@gravity-ui/uikit').IconData;
    export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.ico';
