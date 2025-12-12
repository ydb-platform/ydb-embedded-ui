import {Popup} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

const tooltipB = cn('node-tooltip');

export interface NodeTooltipData {
    nodeId: number | string;
    connected?: number;
    capacity?: number;
    rack: string;
}

export interface NodeTooltipState {
    anchor: HTMLDivElement | null;
    data: NodeTooltipData | null;
}

interface NodeTooltipPopupProps {
    nodeTooltip: NodeTooltipState;
    onClose: () => void;
}

export function NodeTooltipPopup({nodeTooltip, onClose}: NodeTooltipPopupProps) {
    if (!nodeTooltip.anchor || !nodeTooltip.data) {
        return null;
    }

    return (
        <Popup
            open
            hasArrow
            placement={['top', 'bottom', 'left', 'right']}
            anchorElement={nodeTooltip.anchor}
            onOutsideClick={onClose}
        >
            <div className={tooltipB()}>
                <table>
                    <tbody>
                        <tr>
                            <td className={tooltipB('label')}>{i18n('field_id')}</td>
                            <td className={tooltipB('value')}>{nodeTooltip.data.nodeId || '?'}</td>
                        </tr>
                        <tr>
                            <td className={tooltipB('label')}>{i18n('field_rack')}</td>
                            <td className={tooltipB('value')}>{nodeTooltip.data.rack || '?'}</td>
                        </tr>
                        {nodeTooltip.data.connected && nodeTooltip.data.capacity ? (
                            <tr>
                                <td className={tooltipB('label')}>{i18n('field_net')}</td>
                                <td className={tooltipB('value')}>
                                    {`${nodeTooltip.data.connected} / ${nodeTooltip.data.capacity}`}
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </Popup>
    );
}
