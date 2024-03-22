import {colord} from 'colord';

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

export function colorToRGBA(initialColor: string, opacity: number) {
    const color = colord(initialColor);
    if (!color.isValid()) {
        throw new Error('Invalid color is passed');
    }
    return color.alpha(opacity).toRgbString();
}
