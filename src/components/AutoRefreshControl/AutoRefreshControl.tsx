import {ArrowsRotateLeft} from '@gravity-ui/icons';
import {Button, Select} from '@gravity-ui/uikit';

import {api} from '../../store/reducers/api';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';

import i18n from './i18n';

import './AutoRefreshControl.scss';

const b = cn('auto-refresh-control');

interface AutoRefreshControlProps {
    className?: string;
    selectClassName?: string;
}

export function AutoRefreshControl({className, selectClassName}: AutoRefreshControlProps) {
    const dispatch = useTypedDispatch();
    const [autoRefreshInterval, setAutoRefreshInterval] = useAutoRefreshInterval();
    return (
        <div className={b(null, className)}>
            <Button
                view="flat"
                onClick={() => {
                    dispatch(api.util.invalidateTags(['All']));
                }}
                extraProps={{'aria-label': i18n('Refresh')}}
            >
                <Button.Icon>
                    <ArrowsRotateLeft />
                </Button.Icon>
            </Button>
            <Select
                value={[String(autoRefreshInterval)]}
                onUpdate={(v) => {
                    setAutoRefreshInterval(Number(v));
                }}
                width={85}
                className={selectClassName}
            >
                <Select.Option value="0">{i18n('None')}</Select.Option>
                <Select.Option value="15000">{i18n('15 sec')}</Select.Option>
                <Select.Option value="60000">{i18n('1 min')}</Select.Option>
                <Select.Option value="120000">{i18n('2 min')}</Select.Option>
                <Select.Option value="300000">{i18n('5 min')}</Select.Option>
            </Select>
        </div>
    );
}
