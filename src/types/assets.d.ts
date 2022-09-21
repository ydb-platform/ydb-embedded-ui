declare module '*.svg' {
    const content: SVGIconData;
    export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.ico';

declare type SVGIconData =
    import('@gravity-ui/uikit/build/esm/components/Icon/types').SVGIconData;
