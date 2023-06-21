import block from 'bem-cn-lite';

import {formatDurationToShortTimeFormat, parseUsToMs} from '../../../../utils/timeParsers';

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

    return <span className={b()}>{parsedDuration}</span>;
};
