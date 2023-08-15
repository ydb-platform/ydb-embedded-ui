// import cn from 'bem-cn-lite';

// import {MetricCard} from './MetricCard/MetricCard';

// import {Healthcheck} from '../Healthcheck';
// import './DatabaseMetrics.scss';

// const b = cn('database-metrics');

// interface IMetrics {
//     memoryUsed?: number;
//     memoryLimit?: number;
//     cpuUsed?: number;
//     cpuLimit?: number;
//     storageUsed?: number;
//     storageLimit?: number;
// }

// interface DatabaseMetricsProps {
//     tenant: string;
//     showMoreHandler?: VoidFunction;
//     metrics: IMetrics;
// }

// enum MetricsTypes {
//     CPU = 'CPU',
//     Storage = 'Storage',
//     Memory = 'Memory',
// }

// export enum EMetricStatus {
//     Grey = 'Grey',
//     Green = 'Green',
//     Yellow = 'Yellow',
//     Orange = 'Orange',
//     Red = 'Red',
// }

// const metricsUsageToStatus = (type: MetricsTypes, usage: number) => {
//     switch (type) {
//         case MetricsTypes.CPU:
//             if (usage > 70) return EMetricStatus.Red;
//             if (usage > 60) return EMetricStatus.Yellow;
//             return EMetricStatus.Green;
//         case MetricsTypes.Memory:
//             if (usage > 70) return EMetricStatus.Red;
//             if (usage > 60) return EMetricStatus.Yellow;
//             return EMetricStatus.Green;
//         case MetricsTypes.Storage:
//             if (usage > 85) return EMetricStatus.Red;
//             if (usage > 75) return EMetricStatus.Yellow;
//             return EMetricStatus.Green;

//         default:
//             return EMetricStatus.Grey;
//     }
// };

// const calculateUsage = (valueUsed: number, valueLimit: number) => {
//     return `${(valueUsed * 100) / valueLimit}%`;
// };

// export function DatabaseMetrics({tenant, showMoreHandler, metrics}: DatabaseMetricsProps) {
//     // const {memoryUsed, memoryLimit, cpuUsed, cpuLimit, storageUsed, storageLimit} = metrics;
//     const renderContent = (progress: number, text?: string, isSelected?: boolean) => {
//         return (
//             <div className={b('content', isSelected ? 'selected' : '')}>
//                 <div className={b('progress')}>{progress}%</div>
//                 <div className={b('resources')}>{text}</div>
//             </div>
//         );
//     };

//     return (
//         <div className={b()}>
//             <MetricCard label="CPU" progress={87} status="red">
//                 {renderContent(87, '64 cores')}
//             </MetricCard>
//             <MetricCard label="Storage" isSelected={true} progress={70}>
//                 {renderContent(70, '64 GiB', true)}
//             </MetricCard>
//             <MetricCard label="Memory" progress={20}>
//                 {renderContent(20, '64 cores')}
//             </MetricCard>
//             <Healthcheck tenant={tenant} preview={true} showMoreHandler={showMoreHandler} />
//         </div>
//     );
// }

export {};
