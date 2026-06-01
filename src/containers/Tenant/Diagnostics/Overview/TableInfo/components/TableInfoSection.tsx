import React from 'react';

import type {YDBDefinitionListItem} from '../../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../../components/YDBDefinitionList/YDBDefinitionList';

interface TableInfoSectionProps {
    items: YDBDefinitionListItem[];
    title?: string;
    className?: string;
}

/**
 * Reusable component for rendering a section of table information.
 * Displays a YDBDefinitionList with consistent styling and behavior.
 * Returns null if items array is empty.
 * @param items - Array of definition list items to display
 * @param title - Optional section title
 * @param className - Optional additional CSS class
 */
export const TableInfoSection = React.memo<TableInfoSectionProps>(({items, title, className}) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <YDBDefinitionList
            items={items}
            title={title}
            className={className}
            nameMaxWidth="auto"
            responsive
        />
    );
});

TableInfoSection.displayName = 'TableInfoSection';
