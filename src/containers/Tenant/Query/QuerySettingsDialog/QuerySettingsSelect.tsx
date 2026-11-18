import type {SelectOption} from '@gravity-ui/uikit';
import {Label, Select} from '@gravity-ui/uikit';

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
const badgeThemes = {recommended: 'info', legacy: 'unknown', deprecated: 'normal'} as const;

type SelectType = QueryMode | TransactionMode | StatisticsMode | TracingLevel | ResourcePoolValue;
type QuerySettingSelectOption<T> = SelectOption<T> & {
    badge?: 'recommended' | 'legacy' | 'deprecated';
    separatorBefore?: boolean;
};

interface QuerySettingsSelectProps<T extends SelectType> {
    id?: string;
    ariaLabel: string;
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
                aria-label={props.ariaLabel}
                disabled={props.disabled}
                options={props.settingOptions}
                value={[props.setting]}
                onUpdate={(value) => {
                    props.onUpdateSetting(value[0] as T);
                }}
                getOptionHeight={getOptionHeight}
                popupClassName={b('popup', {field: props.id})}
                renderOption={(option: QuerySettingSelectOption<T>) => (
                    <div
                        className={b('item', {
                            type: option.value,
                            disabled: option.disabled,
                            separator: option.separatorBefore,
                        })}
                    >
                        <div className={b('item-title')}>
                            <span className={b('item-label')}>{option.content}</span>
                            {option.badge && (
                                <Label
                                    theme={badgeThemes[option.badge]}
                                    className={b('badge')}
                                    size="xs"
                                >
                                    {i18n(`value_${option.badge}`)}
                                </Label>
                            )}
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
