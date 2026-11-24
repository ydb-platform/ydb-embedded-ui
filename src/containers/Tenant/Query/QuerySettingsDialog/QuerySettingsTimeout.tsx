import React from 'react';

import {Switch, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import {useQueryStreamingSetting} from '../../../../utils/hooks';

import {TimeoutLabel} from './TimeoutLabel';
import i18n from './i18n';

import './QuerySettingsTimeout.scss';

const b = cn('ydb-query-settings-timeout');

interface QuerySettingsTimeoutProps {
    id?: string;
    controlRef?: React.Ref<HTMLInputElement>;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    onToggle: (enabled: boolean) => void;
    validationState?: 'invalid';
    errorMessage?: string;
    isDisabled?: boolean;
}

export function QuerySettingsTimeout({
    id,
    controlRef,
    value,
    onChange,
    onToggle,
    validationState,
    errorMessage,
    isDisabled,
}: QuerySettingsTimeoutProps) {
    const handleValueChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
        },
        [onChange],
    );

    const isChecked = value !== null;
    const [isQueryStreamingEnabled] = useQueryStreamingSetting();
    const switchId = id ? `${id}-switch` : undefined;

    return (
        <React.Fragment>
            <TimeoutLabel
                htmlFor={isQueryStreamingEnabled ? switchId : id}
                isDisabled={isQueryStreamingEnabled && isDisabled}
            />
            <div className={b('control-wrapper')}>
                {isQueryStreamingEnabled && (
                    <Switch
                        className={b('switch')}
                        disabled={isDisabled}
                        checked={isChecked}
                        onUpdate={onToggle}
                        id={switchId}
                        controlProps={{'aria-label': i18n('form.timeout')}}
                    />
                )}
                {isChecked && (
                    <TextInput
                        id={id}
                        controlRef={controlRef}
                        controlProps={{'aria-label': i18n('field_timeout-in-seconds')}}
                        type="number"
                        value={value?.toString() || ''}
                        onChange={handleValueChange}
                        className={b('input')}
                        placeholder="60"
                        validationState={validationState}
                        errorMessage={errorMessage}
                        endContent={
                            <span className={b('postfix')}>{i18n('form.timeout.seconds')}</span>
                        }
                    />
                )}
            </div>
        </React.Fragment>
    );
}
