import React from 'react';

import {CircleCheckFill, CircleXmarkFill} from '@gravity-ui/icons';
import {DefinitionList, Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import type {TBridgePile} from '../../../../types/api/cluster';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';

import './BridgeInfoTable.scss';

const b = cn('bridge-info-table');

interface BridgeInfoTableProps {
    piles: TBridgePile[];
}

interface BridgePileCardProps {
    pile: TBridgePile;
}

const BridgePileCard = React.memo(function BridgePileCard({pile}: BridgePileCardProps) {
    const renderPrimaryStatus = React.useCallback(() => {
        const isPrimary = pile.IsPrimary;
        const icon = isPrimary ? CircleCheckFill : CircleXmarkFill;
        const text = isPrimary ? i18n('value_yes') : i18n('value_no');

        return (
            <Flex gap={1} alignItems="center">
                <Icon data={icon} size={16} className={b('status-icon', {primary: isPrimary})} />
                <Text color="secondary">{text}</Text>
            </Flex>
        );
    }, [pile.IsPrimary]);

    const renderStateStatus = React.useCallback(() => {
        if (!pile.State) {
            return EMPTY_DATA_PLACEHOLDER;
        }

        const isSynchronized = pile.State.toUpperCase() === 'SYNCHRONIZED';
        const theme = isSynchronized ? 'success' : 'info';

        return <Label theme={theme}>{pile.State}</Label>;
    }, [pile.State]);

    const info = React.useMemo(
        () => [
            {
                name: i18n('field_primary'),
                content: renderPrimaryStatus(),
            },
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
        [renderPrimaryStatus, renderStateStatus, pile.Nodes],
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
