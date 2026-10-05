import ChartKit, {settings} from '@gravity-ui/chartkit';
import type {YagrWidgetData} from '@gravity-ui/chartkit/yagr';
import {YagrPlugin} from '@gravity-ui/chartkit/yagr';
import {ThemeProvider} from '@gravity-ui/uikit';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';

import '@gravity-ui/uikit/styles/styles.css';

settings.set({plugins: [YagrPlugin]});

function mountChartKit(
    host: HTMLElement,
    data: YagrWidgetData,
    onChartLoad: (widget: unknown) => void,
    onError: () => void,
) {
    const root = createRoot(host);
    flushSync(() => {
        root.render(
            <ThemeProvider theme="light">
                <ChartKit
                    type="yagr"
                    data={data}
                    onChartLoad={({widget}) => {
                        if (widget) {
                            onChartLoad(widget);
                        }
                    }}
                    onError={onError}
                />
            </ThemeProvider>,
        );
    });
    return () => root.unmount();
}

declare global {
    interface Window {
        YdbMetricChartKit?: {mountChartKit: typeof mountChartKit};
    }
}

window.YdbMetricChartKit = {mountChartKit};
