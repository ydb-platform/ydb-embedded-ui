import type {MetricType} from 'web-vitals';

type ReportCallback = (metric: MetricType) => void;

const reportWebVitals = (onPerfEntry?: ReportCallback) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        import('web-vitals').then(({onCLS, onFID, onFCP, onLCP, onTTFB}) => {
            onCLS(onPerfEntry);
            onFID(onPerfEntry);
            onFCP(onPerfEntry);
            onLCP(onPerfEntry);
            onTTFB(onPerfEntry);
        });
    }
};

export default reportWebVitals;
