import {Card} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface ServerlessTabCardProps {
    text: string;
    active?: boolean;
    helpText?: string;
    subtitle?: string;
}

export function ServerlessTabCard({text, active, helpText, subtitle}: ServerlessTabCardProps) {
    return (
        <div className={b({active})}>
            <Card
                className={b('card-container', {active})}
                type="container"
                view={active ? 'outlined' : 'raised'}
            >
                <div className={b('legend-wrapper')}>
                    <DoughnutMetrics.Legend variant="subheader-2" note={helpText} noteIconSize="s">
                        {text}
                    </DoughnutMetrics.Legend>
                    {subtitle ? (
                        <DoughnutMetrics.Legend variant="body-1" color="secondary">
                            {subtitle}
                        </DoughnutMetrics.Legend>
                    ) : null}
                </div>
            </Card>
        </div>
    );
}
