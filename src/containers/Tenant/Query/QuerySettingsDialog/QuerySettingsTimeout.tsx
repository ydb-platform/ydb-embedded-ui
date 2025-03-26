import React from 'react';

import {TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';

import {TimeoutLabel} from './TimeoutLabel';
import i18n from './i18n';

import './QuerySettingsTimeout.scss';

const b = cn('ydb-query-settings-timeout');

interface QuerySettingsTimeoutProps {
    id?: string;
    value: number | null | undefined;
    onChange: (value: number | undefined) => void;
    onToggle: (enabled: boolean) => void;
    validationState?: 'invalid';
    errorMessage?: string;
    isDisabled?: boolean;
}

export function QuerySettingsTimeout({
    id,
    value,
    onChange,
    onToggle,
    validationState,
    errorMessage,
    isDisabled,
}: QuerySettingsTimeoutProps) {
    const handleValueChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value ? Number(event.target.value) : undefined;
            onChange(newValue);
        },
        [onChange],
    );

    const isChecked = value !== null;

    return (
        <React.Fragment>
            <TimeoutLabel isDisabled={isDisabled} isChecked={isChecked} onToggle={onToggle} />
            {isChecked && (
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
            )}
        </React.Fragment>
    );
}
