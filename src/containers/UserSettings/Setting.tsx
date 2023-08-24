import type {ReactNode} from 'react';

import {RadioButton, Switch} from '@gravity-ui/uikit';
import {Settings} from '@gravity-ui/navigation';

import {LabelWithPopover} from '../../components/LabelWithPopover/LabelWithPopover';

import {useSetting} from '../../utils/hooks';

import {b} from './UserSettings';

export type SettingsElementType = 'switch' | 'radio';

export interface SettingProps {
    type?: SettingsElementType;
    title: string;
    settingKey: string;
    helpPopoverContent?: ReactNode;
    options?: {value: string; content: string}[];
    defaultValue?: unknown;
    onValueUpdate?: VoidFunction;
}

export const Setting = ({
    type = 'switch',
    settingKey,
    title,
    helpPopoverContent,
    options,
    defaultValue,
    onValueUpdate,
}: SettingProps) => {
    const [settingValue, setValue] = useSetting(settingKey, defaultValue);

    const onUpdate = (value: unknown) => {
        setValue(value);
        onValueUpdate?.();
    };

    const renderTitleComponent = (value: ReactNode) => {
        if (helpPopoverContent) {
            return (
                <LabelWithPopover
                    className={b('item-with-popup')}
                    contentClassName={b('popup')}
                    text={value}
                    popoverContent={helpPopoverContent}
                />
            );
        }

        return value;
    };

    const getSettingsElement = (elementType: SettingsElementType) => {
        switch (elementType) {
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

    return (
        <Settings.Item title={title} renderTitleComponent={renderTitleComponent}>
            {getSettingsElement(type)}
        </Settings.Item>
    );
};
