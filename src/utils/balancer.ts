const viewerPathnameRegex = /\/viewer(\/json)?$/;

export const removeBalancerViewerPathname = (value: string) => {
    return value.replace(viewerPathnameRegex, '');
};
