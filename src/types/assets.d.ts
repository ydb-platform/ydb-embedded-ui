declare module '*.svg' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const content: import('@gravity-ui/uikit').IconData;
    export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.ico';
