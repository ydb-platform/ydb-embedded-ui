import {ResponseError} from '../../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {YDBSyntaxHighlighterLazy} from '../../../../components/SyntaxHighlighter/lazy';
import {configsApi} from '../../../../store/reducers/configs';
import {useAutoRefreshInterval} from '../../../../utils/hooks/useAutoRefreshInterval';

interface StartupProps {
    database?: string;
}
export function Startup({database}: StartupProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isLoading, error} = configsApi.useGetConfigQuery(
        {database},
        {pollingInterval: autoRefreshInterval},
    );

    const {startup} = currentData || {};

    return (
        <LoaderWrapper loading={isLoading}>
            {error ? <ResponseError error={error} /> : null}
            {startup ? (
                <YDBSyntaxHighlighterLazy
                    language="yaml"
                    text={startup}
                    transparentBackground={false}
                    withClipboardButton={{alwaysVisible: true, withLabel: false, size: 'm'}}
                />
            ) : null}
        </LoaderWrapper>
    );
}
