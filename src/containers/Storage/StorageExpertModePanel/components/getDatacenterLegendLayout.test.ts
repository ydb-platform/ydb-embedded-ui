import {getDatacenterLegendLayout} from './getDatacenterLegendLayout';

const widths = {labels: [40, 40, 40], unknown: 80, more: 60, gap: 8};

test('does not reserve a more button when every label fits', () => {
    expect(getDatacenterLegendLayout({...widths, available: 224})).toEqual({
        visibleCount: 3,
        showUnknown: true,
    });
});

test('reserves space for Unknown and the actual more button', () => {
    expect(getDatacenterLegendLayout({...widths, available: 220})).toEqual({
        visibleCount: 1,
        showUnknown: true,
    });
});

test('moves Unknown into the popover when it cannot fit beside the button', () => {
    expect(getDatacenterLegendLayout({...widths, available: 100})).toEqual({
        visibleCount: 0,
        showUnknown: false,
    });
});

test('keeps the label order when the first name is too wide', () => {
    expect(getDatacenterLegendLayout({...widths, labels: [300, 20], available: 240})).toEqual({
        visibleCount: 0,
        showUnknown: true,
    });
});

test('handles an empty or initially hidden legend', () => {
    expect(getDatacenterLegendLayout({...widths, labels: [], available: 80})).toEqual({
        visibleCount: 0,
        showUnknown: true,
    });
    expect(getDatacenterLegendLayout({...widths, available: 0})).toEqual({
        visibleCount: 0,
        showUnknown: false,
    });
});
