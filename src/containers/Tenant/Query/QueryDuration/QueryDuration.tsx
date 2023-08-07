import block from 'bem-cn-lite';

import {formatDurationToShortTimeFormat, parseUsToMs} from '../../../../utils/timeParsers';
import {LabelWithPopover} from '../../../../components/LabelWithPopover';

import i18n from '../i18n';

import './QueryDuration.scss';

interface QueryDurationProps {
    duration?: string;
}

const b = block('ydb-query-duration');

export const QueryDuration = ({duration}: QueryDurationProps) => {
    if (!duration) {
        return null;
    }

    const parsedDuration = formatDurationToShortTimeFormat(parseUsToMs(duration), 1);

    return (
        <span className={b()}>
            <LabelWithPopover
                className={b('item-with-popover')}
                contentClassName={b('popover')}
                text={parsedDuration}
                popoverContent={i18n('query-duration.description')}
            />
        </span>
    );
};
