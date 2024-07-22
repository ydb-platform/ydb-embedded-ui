import type {SelectOption} from '@gravity-ui/uikit';
import {Select} from '@gravity-ui/uikit';

import type {
    IsolationLevel,
    QueryMode,
    StatisticsMode,
    TracingLevel,
} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';

import i18n from './i18n';

import './QuerySettingsSelect.scss';

// Make option height dynamic.
// By default it has static height.
export const getOptionHeight = () => -1;

const b = cn('ydb-query-settings-select');

type SelectType = QueryMode | IsolationLevel | StatisticsMode | TracingLevel;
type QuerySettingSelectOption<T> = SelectOption<T> & {isDefault?: boolean};

interface QuerySettingsSelectProps<T extends SelectType> {
    setting: T;
    settingOptions: QuerySettingSelectOption<T>[];
    onUpdateSetting: (mode: T) => void;
}

export function QuerySettingsSelect<T extends SelectType>(props: QuerySettingsSelectProps<T>) {
    return (
        <div className={b('selector')}>
            <Select<T>
                options={props.settingOptions}
                value={[props.setting]}
                onUpdate={(value) => {
                    props.onUpdateSetting(value[0] as T);
                }}
                getOptionHeight={getOptionHeight}
                popupClassName={b('popup')}
                renderOption={(option: QuerySettingSelectOption<T>) => (
                    <div className={b('item')}>
                        <div className={b('item-title')}>
                            {option.content}
                            {option.isDefault ? i18n('description.default') : ''}
                        </div>
                        {option.text && (
                            <span className={b('item-description')}>{option.text}</span>
                        )}
                    </div>
                )}
                width="max"
            />
        </div>
    );
}
