import {LabelWithPopover} from '../../../../components/LabelWithPopover';
import {cn} from '../../../../utils/cn';
import {formatDurationToShortTimeFormat, parseUsToMs} from '../../../../utils/timeParsers';
import i18n from '../i18n';

import './QueryDuration.scss';

interface QueryDurationProps {
    duration?: string | number;
}

const b = cn('ydb-query-duration');

export const QueryDuration = ({duration}: QueryDurationProps) => {
    if (!duration) {
        return null;
    }

    const parsedDuration = formatDurationToShortTimeFormat(parseUsToMs(duration), 1);

    return (
        <span className={b()}>
            <LabelWithPopover
                className={b('item-with-popover')}
                contentClassName={b('popover-content')}
                text={parsedDuration}
                popoverClassName={b('popover')}
                popoverContent={i18n('query-duration.description')}
                buttonProps={{className: b('popover-button')}}
            />
        </span>
    );
};
