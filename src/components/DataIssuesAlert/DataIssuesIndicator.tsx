import {TriangleExclamation} from '@gravity-ui/icons';
import {Button, Icon, Popover} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import {DataIssuesList} from './DataIssuesAlert';
import type {DataIssuesProps} from './DataIssuesAlert';
import i18n from './i18n';

import './DataIssuesAlert.scss';

const b = cn('ydb-data-issues-alert');

export const DATA_ISSUES_INDICATOR_QA = 'data-issues-indicator';

interface DataIssuesIndicatorProps extends DataIssuesProps {
    /** A shorter label for places where the width is shared with other controls */
    compact?: boolean;
    className?: string;
}

/**
 * Compact form of `DataIssuesAlert`: the details open in a popover on hover or on click.
 * Takes no space of its own in the page flow, so it fits sticky table controls:
 * the rows do not move when it appears or disappears.
 */
export function DataIssuesIndicator({
    issues,
    problems,
    compact,
    className,
}: DataIssuesIndicatorProps) {
    if (!issues.length) {
        return null;
    }

    return (
        <Popover
            placement={['bottom-start', 'top-start']}
            className={b('popover')}
            content={<DataIssuesList issues={issues} problems={problems} />}
        >
            <Button
                view="flat-warning"
                size="s"
                className={b('indicator', className)}
                qa={DATA_ISSUES_INDICATOR_QA}
            >
                <Icon data={TriangleExclamation} size={14} />
                {compact ? i18n('title_data-issues-short') : i18n('title_data-issues')}
            </Button>
        </Popover>
    );
}
