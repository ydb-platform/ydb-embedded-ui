import {SegmentedRadioGroup, Switch} from '@gravity-ui/uikit';

import {useSetting} from '../../utils/hooks';

export interface SettingsInfoFieldProps {
    type: 'info';
    title: string;
    description?: React.ReactNode;
    content: React.ReactNode;
}

export type SettingsElementType = 'switch' | 'radio';

export interface SettingProps {
    type?: SettingsElementType;
    title: string;
    description?: React.ReactNode;
    disabled?: boolean;
    settingKey: string;
    options?: {value: string; content: string}[];
    defaultValue?: unknown;
    /**
     * Displayed value when the setting is effectively overridden by runtime context.
     * The persisted user setting is still kept unchanged.
     */
    effectiveValue?: unknown;
    onValueUpdate?: VoidFunction;
}

export const Setting = ({
    type = 'switch',
    settingKey,
    options,
    defaultValue,
    effectiveValue,
    onValueUpdate,
    disabled,
}: SettingProps) => {
    const [settingValue, setValue] = useSetting(settingKey, defaultValue);
    const displayedValue = effectiveValue ?? settingValue;

    const onUpdate = (value: unknown) => {
        setValue(value);
        onValueUpdate?.();
    };

    switch (type) {
        case 'switch': {
            return (
                <Switch checked={Boolean(displayedValue)} onUpdate={onUpdate} disabled={disabled} />
            );
        }

        case 'radio': {
            if (!options) {
                return null;
            }

            return (
                <SegmentedRadioGroup
                    value={String(displayedValue)}
                    onUpdate={onUpdate}
                    disabled={disabled}
                >
                    {options.map(({value, content}) => {
                        return (
                            <SegmentedRadioGroup.Option value={value} key={value}>
                                {content}
                            </SegmentedRadioGroup.Option>
                        );
                    })}
                </SegmentedRadioGroup>
            );
        }

        default:
            return null;
    }
};
