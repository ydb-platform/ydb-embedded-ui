import React from 'react';

import {CircleQuestion} from '@gravity-ui/icons';
import {Icon, Popover, Switch, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import {ENABLE_QUERY_STREAMING} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';

import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
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
    const [isQueryStreamingEnabled] = useSetting(ENABLE_QUERY_STREAMING);

    const handleValueChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value ? Number(event.target.value) : undefined;
            onChange(newValue);
        },
        [onChange],
    );

    const isChecked = value !== null;

    const queryStreamingLabel = isQueryStreamingEnabled ? (
        <div className={b('switch-title')}>
            <Switch
                disabled={isDisabled}
                checked={isChecked}
                onUpdate={onToggle}
                className={b('switch')}
                content={QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
            />
            {isDisabled ? (
                <Popover
                    content={i18n('form.timeout.disabled')}
                    placement={'bottom-start'}
                    hasArrow={false}
                    size="s"
                >
                    <Icon className={b('question-icon')} data={CircleQuestion} />
                </Popover>
            ) : null}
        </div>
    ) : (
        <label htmlFor="timeout" className={b('label-title')}>
            {QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
        </label>
    );

    return (
        <React.Fragment>
            {queryStreamingLabel}
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
