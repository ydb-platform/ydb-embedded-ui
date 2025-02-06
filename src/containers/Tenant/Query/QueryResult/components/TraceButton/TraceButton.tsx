import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';

import {useClusterBaseInfo} from '../../../../../../store/reducers/cluster/cluster';
import {replaceParams} from '../../../utils/replaceParams';
import i18n from '../../i18n';

interface TraceUrlButtonProps {
    traceId: string;
}

export function TraceButton({traceId}: TraceUrlButtonProps) {
    const {traceView} = useClusterBaseInfo();

    const traceUrl = traceView?.url ? replaceParams(traceView.url, {traceId}) : '';

    if (!traceUrl) {
        return null;
    }

    return (
        <Button view={'flat-info'} href={traceUrl} target="_blank">
            {i18n('trace')}
            <Button.Icon>
                <ArrowUpRightFromSquare />
            </Button.Icon>
        </Button>
    );
}
