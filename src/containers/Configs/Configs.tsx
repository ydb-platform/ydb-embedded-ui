import React from 'react';

import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useBaseConfigAvailable,
    useFeatureFlagsAvailable,
} from '../../store/reducers/capabilities/hooks';
import {cn} from '../../utils/cn';

import {Config} from './components/Config/Config';
import {FeatureFlags} from './components/FeatureFlags/FeatureFlags';
import {Startup} from './components/Startup/Startup';
import type {ConfigType} from './types';
import {ConfigTypeTitles, ConfigTypes} from './types';
import {useConfigQueryParams} from './useConfigsQueryParams';

import './Configs.scss';

interface ConfigsProps {
    database?: string;
    className?: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

const b = cn('ydb-configs');

export function Configs({database, className, scrollContainerRef}: ConfigsProps) {
    const {configType} = useConfigQueryParams();

    const isFeaturesAvailable = useFeatureFlagsAvailable();
    const isConfigsAvailable = useBaseConfigAvailable();

    const options = React.useMemo(() => {
        const options: ConfigType[] = [];
        if (isFeaturesAvailable) {
            options.push(ConfigTypes.features);
        }
        if (isConfigsAvailable) {
            options.push(ConfigTypes.current);
            options.push(ConfigTypes.startup);
        }
        return options;
    }, [isFeaturesAvailable, isConfigsAvailable]);

    const renderContent = () => {
        switch (configType) {
            case ConfigTypes.current:
                return <Config database={database} />;
            case ConfigTypes.startup:
                return <Startup database={database} className={b('startup')} />;
            case ConfigTypes.features:
                return <FeatureFlags database={database} className={b('feature-flags')} />;
        }
    };

    return (
        <TableWithControlsLayout fullHeight className={b(null, className)}>
            <TableWithControlsLayout.Controls>
                <ConfigSelector options={options} />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table scrollContainerRef={scrollContainerRef}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}

function ConfigSelector({options}: {options: ConfigType[]}) {
    const {configType, handleConfigTypeChange} = useConfigQueryParams();

    if (!options.length) {
        return null;
    }

    return (
        <SegmentedRadioGroup value={configType} onUpdate={handleConfigTypeChange}>
            {options.map((option) => (
                <SegmentedRadioGroup.Option key={option} value={option}>
                    {ConfigTypeTitles[option]}
                </SegmentedRadioGroup.Option>
            ))}
        </SegmentedRadioGroup>
    );
}
