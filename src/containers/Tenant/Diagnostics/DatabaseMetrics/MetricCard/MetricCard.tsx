// import cn from 'bem-cn-lite';

// import {CircularProgressBar} from '../../../../../components/CircularProgressBar/CircularProgressBar';

// import './MetricCard.scss';
// import {ReactNode} from 'react';
// import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';

// const b = cn('metric-card');

// interface MetricCardProps {
//     isSelected?: boolean;
//     onClick?: () => void;
//     children?: ReactNode;
//     progress?: number;
//     className?: string;
//     label?: string;
//     status?: string;
// }

// export function MetricCard({
//     children,
//     progress,
//     label,
//     isSelected,
//     status = 'green',
// }: MetricCardProps) {
//     return (
//         <DiagnosticCard className={b(null)}>
//             <div className={b('header')}>{label && <div className={b('label')}>{label}</div>}</div>
//             <CircularProgressBar
//                 size={172}
//                 strokeWidth={11}
//                 progress={progress}
//                 content={children}
//                 isSelected={isSelected}
//                 status={status}
//             />
//         </DiagnosticCard>
//     );
// }

export {};
