import React from 'react';

import {DefinitionList, Flex, Label, Text} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

import type {TBridgePile} from '../../../../types/api/cluster';
import {BridgePileState} from '../../../../types/api/cluster';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';

import './BridgeInfoTable.scss';

const b = cn('bridge-info-table');

function getBridgePileStateTheme(state?: string): NonNullable<LabelProps['theme']> {
    if (!state) {
        return 'unknown';
    }

    switch (state.toUpperCase()) {
        case BridgePileState.PRIMARY:
            return 'success'; // Green - active primary
        case BridgePileState.PROMOTE:
            return 'warning'; // Orange - transitioning to primary
        case BridgePileState.SYNCHRONIZED:
            return 'info'; // Blue - ready but not primary
        case BridgePileState.NOT_SYNCHRONIZED:
            return 'danger'; // Red - problematic state
        case BridgePileState.SUSPENDED:
            return 'utility'; // Gray - graceful shutdown
        case BridgePileState.DISCONNECTED:
            return 'danger'; // Red - connectivity issue
        case BridgePileState.UNSPECIFIED:
        default:
            return 'unknown'; // Purple - unknown state
    }
}

interface BridgeInfoTableProps {
    piles: TBridgePile[];
}

interface BridgePileCardProps {
    pile: TBridgePile;
}

const BridgePileCard = React.memo(function BridgePileCard({pile}: BridgePileCardProps) {
    const renderStateStatus = React.useCallback(() => {
        if (!pile.State) {
            return EMPTY_DATA_PLACEHOLDER;
        }

        const theme = getBridgePileStateTheme(pile.State);
        return <Label theme={theme}>{pile.State}</Label>;
    }, [pile.State]);

    const info = React.useMemo(
        () => [
            {
                name: i18n('field_state'),
                content: renderStateStatus(),
            },
            {
                name: i18n('field_nodes'),
                content:
                    pile.Nodes === undefined ? EMPTY_DATA_PLACEHOLDER : formatNumber(pile.Nodes),
            },
        ],
        [renderStateStatus, pile.Nodes],
    );

    return (
        <Flex direction="column" gap={3} className={b('pile-card')}>
            <Text variant="body-2">{pile.Name || EMPTY_DATA_PLACEHOLDER}</Text>
            <DefinitionList nameMaxWidth={160}>
                {info.map(({name, content}) => (
                    <DefinitionList.Item key={name} name={name}>
                        {content}
                    </DefinitionList.Item>
                ))}
            </DefinitionList>
        </Flex>
    );
});

export const BridgeInfoTable = React.memo(function BridgeInfoTable({piles}: BridgeInfoTableProps) {
    const renderedPiles = React.useMemo(
        () => piles.map((pile, index) => <BridgePileCard key={pile.PileId ?? index} pile={pile} />),
        [piles],
    );

    return (
        <Flex gap={2} className={b()}>
            {renderedPiles}
        </Flex>
    );
});
