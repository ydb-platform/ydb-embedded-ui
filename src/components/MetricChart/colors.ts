// Grafana classic palette
export const colors = [
    '#7EB26D', // 0: pale green
    '#EAB839', // 1: mustard
    '#6ED0E0', // 2: light blue
    '#EF843C', // 3: orange
    '#E24D42', // 4: red
    '#1F78C1', // 5: ocean
    '#BA43A9', // 6: purple
    '#705DA0', // 7: violet
    '#508642', // 8: dark green
    '#CCA300', // 9: dark sand
];

export function colorHexToRGBA(htmlColor: string, opacity: number) {
    const COLOR_REGEX = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
    const arrRGB = htmlColor.match(COLOR_REGEX);
    if (arrRGB === null) {
        throw new Error(
            'Invalid color passed, the color should be in the html format. Example: #ff0033',
        );
    }
    const red = parseInt(arrRGB[1], 16);
    const green = parseInt(arrRGB[2], 16);
    const blue = parseInt(arrRGB[3], 16);
    return `rgba(${[red, green, blue, opacity].join(',')})`;
}
