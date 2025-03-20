import React from 'react';

import {Switch, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
import i18n from './i18n';

import './QuerySettingsTimeout.scss';

const b = cn('ydb-query-settings-timeout');

interface QuerySettingsTimeoutProps {
    id?: string;
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
    validationState?: 'invalid';
    errorMessage?: string;
}

export function QuerySettingsTimeout({
    id,
    value,
    onChange,
    isEnabled,
    onToggle,
    validationState,
    errorMessage,
}: QuerySettingsTimeoutProps) {
    const handleValueChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value ? Number(event.target.value) : undefined;
            onChange(newValue);
        },
        [onChange],
    );

    return (
        <React.Fragment>
            <Switch checked={isEnabled} onUpdate={onToggle} className={b('title')}>
                {QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
            </Switch>
            {isEnabled ? (
                <div className={b('control-wrapper')}>
                    <TextInput
                        id={id}
                        type="number"
                        value={value?.toString() || ''}
                        onChange={handleValueChange}
                        className={b('input')}
                        placeholder="60"
                        validationState={validationState}
                        errorMessage={errorMessage}
                        errorPlacement="inside"
                        endContent={
                            <span className={b('postfix')}>{i18n('form.timeout.seconds')}</span>
                        }
                    />
                </div>
            ) : null}
        </React.Fragment>
    );
}
