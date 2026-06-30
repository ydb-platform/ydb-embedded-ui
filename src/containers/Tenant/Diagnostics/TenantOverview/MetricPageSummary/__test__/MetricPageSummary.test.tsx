import {render} from '@testing-library/react';

import {MetricPageSummary} from '../MetricPageSummary';

function getProgress(container: HTMLElement) {
    const progress = container.querySelector<HTMLElement>(
        '[data-qa="tenant-page-metric-summary-progress"]',
    );

    expect(progress).not.toBeNull();

    return progress as HTMLElement;
}

describe('MetricPageSummary', () => {
    test('renders the figma-style segmented progress bar', () => {
        const {container} = render(
            <MetricPageSummary
                dataQa="tenant-page-metric-summary-cpu"
                description="CPU load"
                presentation={{
                    percentText: '78%',
                    progressTheme: 'warning',
                    progressValue: 78,
                    valueText: '68 of 87 cores',
                }}
            />,
        );

        const progress = getProgress(container);

        expect(progress).toHaveClass('ydb-tenant-metric-page-summary__progress');
        expect(progress).toHaveStyle({'--metric-page-summary-progress-value': '78'});
        expect(
            container.querySelector('.ydb-tenant-metric-page-summary__progress-fill'),
        ).toBeVisible();
        expect(
            container.querySelector('.ydb-tenant-metric-page-summary__progress-rest'),
        ).toBeVisible();
    });

    test('uses the shared minimum segment width pattern', () => {
        const {container} = render(
            <MetricPageSummary
                dataQa="tenant-page-metric-summary-cpu"
                description="CPU load"
                presentation={{
                    percentText: '0.5%',
                    progressTheme: 'success',
                    progressValue: 0.5,
                }}
            />,
        );

        expect(
            container.querySelector('.ydb-tenant-metric-page-summary__progress-fill'),
        ).toBeVisible();
    });

    test('keeps a minimal placeholder segment for zero and handles full progress', () => {
        const {container, rerender} = render(
            <MetricPageSummary
                dataQa="tenant-page-metric-summary-cpu"
                description="CPU load"
                presentation={{
                    percentText: '0%',
                    progressValue: 0,
                }}
            />,
        );

        expect(getProgress(container)).toHaveClass('ydb-tenant-metric-page-summary__progress');
        expect(
            container.querySelector('.ydb-tenant-metric-page-summary__progress-fill'),
        ).toBeVisible();

        rerender(
            <MetricPageSummary
                dataQa="tenant-page-metric-summary-cpu"
                description="CPU load"
                presentation={{
                    percentText: '100%',
                    progressTheme: 'danger',
                    progressValue: 100,
                }}
            />,
        );

        expect(getProgress(container)).toHaveClass('ydb-tenant-metric-page-summary__progress_full');
    });
});
