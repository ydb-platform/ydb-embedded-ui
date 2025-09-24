import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {cn} from '../../utils/cn';

import {Config} from './components/Config/Config';
import {FeatureFlags} from './components/FeatureFlags/FeatureFlags';
import {Startup} from './components/Startup/Startup';
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

    const renderContent = () => {
        switch (configType) {
            case ConfigTypes.current:
                return <Config database={database} />;
            case ConfigTypes.startup:
                return <Startup database={database} />;
            case ConfigTypes.features:
                return <FeatureFlags database={database} className={b('feature-flags')} />;
        }
    };

    return (
        <TableWithControlsLayout fullHeight className={b(null, className)}>
            <TableWithControlsLayout.Controls>
                <ConfigSelector />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table scrollContainerRef={scrollContainerRef}>
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}

function ConfigSelector() {
    const {configType, handleConfigTypeChange} = useConfigQueryParams();

    return (
        <SegmentedRadioGroup value={configType} onUpdate={handleConfigTypeChange}>
            <SegmentedRadioGroup.Option value={ConfigTypes.current}>
                {ConfigTypeTitles[ConfigTypes.current]}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={ConfigTypes.startup}>
                {ConfigTypeTitles[ConfigTypes.startup]}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={ConfigTypes.features}>
                {ConfigTypeTitles[ConfigTypes.features]}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
}
