import {RadioButton, Switch} from '@gravity-ui/uikit';

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
    settingKey: string;
    options?: {value: string; content: string}[];
    defaultValue?: unknown;
    onValueUpdate?: VoidFunction;
}

export const Setting = ({
    type = 'switch',
    settingKey,
    options,
    defaultValue,
    onValueUpdate,
}: SettingProps) => {
    const [settingValue, setValue] = useSetting(settingKey, defaultValue);

    const onUpdate = (value: unknown) => {
        setValue(value);
        onValueUpdate?.();
    };

    switch (type) {
        case 'switch': {
            return <Switch checked={Boolean(settingValue)} onUpdate={onUpdate} />;
        }

        case 'radio': {
            if (!options) {
                return null;
            }

            return (
                <RadioButton value={String(settingValue)} onUpdate={onUpdate}>
                    {options.map(({value, content}) => {
                        return (
                            <RadioButton.Option value={value} key={value}>
                                {content}
                            </RadioButton.Option>
                        );
                    })}
                </RadioButton>
            );
        }

        default:
            return null;
    }
};
