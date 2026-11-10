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
    className?: string;
}

/** Compact form of `DataIssuesAlert` for small tables: the details open in a popover */
export function DataIssuesIndicator({issues, problems, className}: DataIssuesIndicatorProps) {
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
                {i18n('title_data-issues')}
            </Button>
        </Popover>
    );
}
