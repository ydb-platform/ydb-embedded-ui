import {cn} from '../../utils/cn';

import './QuerySettingsDescription.scss';

const b = cn('ydb-query-settings-description');

interface QuerySettingsDescriptionProps {
    prefix: string;
    querySettings: Record<string, string>;
}

const QuerySettingsDescription = ({querySettings, prefix}: QuerySettingsDescriptionProps) => {
    return (
        <div className={b('message')}>
            {prefix}
            {Object.entries(querySettings).map(([key, value], index, arr) => (
                <span key={index} className={b('description-item')}>
                    {`${key}: ${value}`}
                    {index < arr.length - 1 ? ', ' : null}
                </span>
            ))}
        </div>
    );
};

export default QuerySettingsDescription;
