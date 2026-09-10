import {useThemeValue} from '@gravity-ui/uikit';
import MonacoEditor from 'react-monaco-editor';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {configsApi} from '../../../../store/reducers/configs';
import {useAutoRefreshInterval} from '../../../../utils/hooks/useAutoRefreshInterval';

interface StartupProps {
    database?: string;
    className?: string;
}

const EDITOR_OPTIONS = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    readOnly: true,
    minimap: {
        enabled: false,
    },
    wrappingIndent: 'indent' as const,
};

export function Startup({database, className}: StartupProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const theme = useThemeValue();
    const {currentData, isLoading, error} = configsApi.useGetConfigQuery(
        {database},
        {pollingInterval: autoRefreshInterval},
    );

    const {startup} = currentData || {};

    return (
        <LoaderWrapper loading={isLoading}>
            {error ? <ResponseError error={error} /> : null}
            {startup ? (
                <div className={className}>
                    <MonacoEditor
                        language={'yaml'}
                        value={startup}
                        options={EDITOR_OPTIONS}
                        theme={`vs-${theme}`}
                    />
                </div>
            ) : null}
        </LoaderWrapper>
    );
}
