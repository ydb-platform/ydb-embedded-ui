import React from 'react';

import {InternalError} from '@gravity-ui/illustrations';
import {DefinitionList, Flex, Text} from '@gravity-ui/uikit';
import QRCode from 'qrcode';
import {ErrorBoundary as ErrorBoundaryBase} from 'react-error-boundary';

import {cn} from '../../utils/cn';
import {registerError} from '../../utils/registerError';
import {useComponent} from '../ComponentsProvider/ComponentsProvider';

import i18n from './i18n';
import type {DiagnosticsData} from './utils';
import {collectDiagnosticsData, prepareErrorStack} from './utils';

import './ErrorBoundary.scss';

const b = cn('ydb-error-boundary');

export function ErrorBoundary({children}: {children?: React.ReactNode}) {
    const ErrorBoundaryComponent = useComponent('ErrorBoundary');
    return <ErrorBoundaryComponent>{children}</ErrorBoundaryComponent>;
}

interface ErrorBoundaryProps {
    children?: React.ReactNode;
}

export function ErrorBoundaryInner({children}: ErrorBoundaryProps) {
    return (
        <ErrorBoundaryBase
            onError={(error, info) => {
                registerError(error, info.componentStack ?? undefined, 'error-boundary');
            }}
            fallbackRender={({error}) => {
                return <ErrorBoundaryFallback error={error} />;
            }}
        >
            {children}
        </ErrorBoundaryBase>
    );
}

interface ErrorBoundaryFallbackProps {
    error: Error;
}
export function ErrorBoundaryFallback({error}: ErrorBoundaryFallbackProps) {
    const [diagnosticsData, setDiagnosticsData] = React.useState<DiagnosticsData | undefined>();

    React.useEffect(() => {
        collectDiagnosticsData(error).then((data) => {
            setDiagnosticsData(data);
        });
    }, [error]);

    return (
        <Flex direction="column" gap={4} className={b(null)}>
            <Flex direction="row" alignItems="center" gap={10}>
                <InternalError width={230} height={230} />
                <Flex direction="column" gap={5}>
                    <Flex direction="column" gap={2}>
                        <Text variant="subheader-3">{i18n('error-title')}</Text>
                        <Text variant="body-1" color="complementary">
                            {i18n('error-description')}
                        </Text>
                    </Flex>
                    <DiagnosticsDataList data={diagnosticsData} />
                </Flex>
            </Flex>
            <Flex direction="row" alignItems="start" gap={8}>
                <ErrorStack stack={error.stack} />
                <Flex direction="column" gap={3}>
                    <Text variant="body-1" color="complementary" className={b('qr-help-text')}>
                        {i18n('send-qr-message')}
                    </Text>
                    <DiagnosticsDataQR data={diagnosticsData} />
                </Flex>
            </Flex>
        </Flex>
    );
}

function DiagnosticsDataList({data}: {data?: DiagnosticsData}) {
    return (
        <DefinitionList nameMaxWidth={200}>
            {data?.uiVersion && typeof data.uiVersion === 'string' && (
                <DefinitionList.Item name={i18n('ui-version')}>
                    {data.uiVersion}
                </DefinitionList.Item>
            )}
            {data?.backendVersion && typeof data.backendVersion === 'string' && (
                <DefinitionList.Item name={i18n('backend-version')}>
                    {data.backendVersion}
                </DefinitionList.Item>
            )}
            <DefinitionList.Item name={i18n('error')}>{data?.error.message}</DefinitionList.Item>
        </DefinitionList>
    );
}

function ErrorStack({stack}: {stack?: string}) {
    if (!stack) {
        return null;
    }

    const stackToDisplay = prepareErrorStack(stack, {
        trim: false,
        maxLength: undefined,
    });

    return (
        <Flex direction="column" className={b('error-stack-wrapper')}>
            <Text variant="body-1" className={b('error-stack-title')}>
                {i18n('stack-title')}
            </Text>
            <Text variant="code-1" className={b('error-stack-code')}>
                {stackToDisplay}
            </Text>
        </Flex>
    );
}

function DiagnosticsDataQR({data}: {data?: DiagnosticsData}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (data) {
            QRCode.toCanvas(canvasRef.current, JSON.stringify(data), {
                errorCorrectionLevel: 'L',
                width: 400,
            });
        }
    }, [data]);

    if (!data) {
        return null;
    }

    return <canvas ref={canvasRef} />;
}
