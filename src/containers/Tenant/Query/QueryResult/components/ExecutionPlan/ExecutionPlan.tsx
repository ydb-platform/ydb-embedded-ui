import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Alert, Button, Flex, Icon, Loader, useThemeValue} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';

import {planToSvgApi} from '../../../../../../store/reducers/planToSvg';
import type {QueryPlan, ScriptPlan} from '../../../../../../types/api/query';
import {cn} from '../../../../../../utils/cn';
import {downloadFile} from '../../../../../../utils/downloadFile';
import {prepareCommonErrorMessage} from '../../../../../../utils/errors';
import i18n from '../../i18n';
import {StubMessage} from '../Stub/Stub';

import {getSvgPalette, themeSvg} from './svgTheme';

import './ExecutionPlan.scss';

const b = cn('ydb-execution-plan');

interface ExecutionPlanProps {
    database: string;
    plan?: QueryPlan | ScriptPlan;
}

export function ExecutionPlan({database, plan}: ExecutionPlanProps) {
    const theme = useThemeValue();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const args = React.useMemo(() => (plan ? {database, plan} : skipToken), [database, plan]);
    const {
        currentData: svg,
        error,
        isFetching,
        refetch,
    } = planToSvgApi.usePlanToSvgQueryQuery(args);
    const [image, setImage] = React.useState<{
        source: typeof args;
        svg: string;
        theme: string;
        url?: string;
    }>();
    const [failedUrl, setFailedUrl] = React.useState<string>();
    const [attempt, setAttempt] = React.useState(0);

    React.useEffect(() => {
        if (!svg || !containerRef.current) {
            return undefined;
        }
        try {
            const styledSvg = themeSvg(svg, getSvgPalette(containerRef.current));
            const url = URL.createObjectURL(new Blob([styledSvg], {type: 'image/svg+xml'}));
            setImage({source: args, svg, theme, url});
            return () => URL.revokeObjectURL(url);
        } catch {
            setImage({source: args, svg, theme});
            return undefined;
        }
    }, [args, svg, theme, attempt]);

    const currentImage =
        image?.source === args && image.svg === svg && image.theme === theme ? image : undefined;
    const url = currentImage?.url;
    const renderContent = () => {
        if (!plan) {
            return <StubMessage message={i18n('context_execution-plan-unavailable')} />;
        }
        if (isFetching) {
            return (
                <Flex justifyContent="center" alignItems="center" className={b()}>
                    <Loader />
                </Flex>
            );
        }
        if (error || !svg || (currentImage && !url) || (url && failedUrl === url)) {
            return (
                <Flex direction="column" gap={3} className={b('error')}>
                    <div role="alert">
                        <Alert
                            theme="danger"
                            message={
                                error
                                    ? prepareCommonErrorMessage(error)
                                    : i18n('alert_execution-plan-image')
                            }
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setAttempt((value) => value + 1);
                            refetch();
                        }}
                    >
                        {i18n('action_retry')}
                    </Button>
                </Flex>
            );
        }
        return (
            <React.Fragment>
                <div className={b('download')}>
                    <ActionTooltip title={i18n('action_download-svg')}>
                        <Button
                            view="flat-secondary"
                            disabled={!url}
                            aria-label={i18n('action_download-svg')}
                            onClick={() => {
                                if (url) {
                                    downloadFile(url, 'query-plan.svg');
                                }
                            }}
                        >
                            <Icon data={ArrowDownToLine} size={16} />
                        </Button>
                    </ActionTooltip>
                </div>
                <div className={b('viewport')}>
                    {url ? (
                        <img
                            src={url}
                            alt={i18n('title_execution-plan')}
                            onError={() => setFailedUrl(url)}
                        />
                    ) : (
                        <Loader />
                    )}
                </div>
            </React.Fragment>
        );
    };
    return (
        <div className={b()} ref={containerRef}>
            {renderContent()}
        </div>
    );
}
