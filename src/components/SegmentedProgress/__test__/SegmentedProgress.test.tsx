import {render, screen} from '@testing-library/react';

import {SegmentedProgress} from '../SegmentedProgress';

describe('SegmentedProgress', () => {
    test('supports themed progress without labels', () => {
        const {container} = render(
            <SegmentedProgress
                value={25}
                total={100}
                theme="danger"
                hideLabels
                dataQa="metric-summary-progress"
            />,
        );

        const progress = container.querySelector('[data-qa="metric-summary-progress"]');

        expect(progress).toHaveClass('ydb-segmented-progress_theme_danger');
        expect(screen.queryByText('25%')).not.toBeInTheDocument();
    });

    test('does not render used section for zero progress', () => {
        const {container} = render(<SegmentedProgress value={0} total={100} hideLabels />);

        expect(container.querySelector('.ydb-segmented-progress__section_used')).toBeNull();
    });
});
