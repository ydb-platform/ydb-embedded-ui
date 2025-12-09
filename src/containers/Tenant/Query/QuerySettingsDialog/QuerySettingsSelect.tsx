import type {SelectOption} from '@gravity-ui/uikit';
import {Select} from '@gravity-ui/uikit';

import type {
    QueryMode,
    StatisticsMode,
    TracingLevel,
    TransactionMode,
} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import type {ResourcePoolValue} from '../../../../utils/query';

import i18n from './i18n';

import './QuerySettingsSelect.scss';

// Make option height dynamic.
// By default it has static height.
export const getOptionHeight = () => -1;

const b = cn('ydb-query-settings-select');

type SelectType = QueryMode | TransactionMode | StatisticsMode | TracingLevel | ResourcePoolValue;
type QuerySettingSelectOption<T> = SelectOption<T> & {isDefault?: boolean};

interface QuerySettingsSelectProps<T extends SelectType> {
    id?: string;
    setting: T;
    settingOptions: QuerySettingSelectOption<T>[];
    disabled?: boolean;
    onUpdateSetting: (mode: T) => void;
}

export function QuerySettingsSelect<T extends SelectType>(props: QuerySettingsSelectProps<T>) {
    return (
        <div className={b('selector')}>
            <Select<T>
                id={props.id}
                disabled={props.disabled}
                options={props.settingOptions}
                value={[props.setting]}
                onUpdate={(value) => {
                    props.onUpdateSetting(value[0] as T);
                }}
                getOptionHeight={getOptionHeight}
                popupClassName={b('popup')}
                renderOption={(option: QuerySettingSelectOption<T>) => (
                    <div className={b('item', {type: option.value})}>
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
