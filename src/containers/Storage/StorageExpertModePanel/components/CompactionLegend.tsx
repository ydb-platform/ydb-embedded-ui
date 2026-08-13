import i18n from '../i18n';

import {StatusPairLegend} from './StatusPairLegend';

export function CompactionLegend({className}: {className?: string}) {
    return <StatusPairLegend className={className} label={i18n('compaction_key')} />;
}
