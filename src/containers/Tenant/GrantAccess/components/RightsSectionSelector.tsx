import React from 'react';

import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import type {AvailablePermissionsConfig} from '../../../../types/api/acl';
import i18n from '../i18n';
import type {RightsView} from '../shared';
import {block} from '../shared';

const RightsViewTitle: Record<RightsView, string> = {
    Groups: i18n('label_groups'),
    Granular: i18n('label_granular'),
};

interface RightsSectionSelectorProps {
    value: RightsView;
    onUpdate: (value: RightsView) => void;
    availablePermissions?: AvailablePermissionsConfig;
    rights: Map<string, boolean>;
}

export function RightsSectionSelector({
    value,
    onUpdate,
    availablePermissions,
    rights,
}: RightsSectionSelectorProps) {
    const selectedRulesCount = availablePermissions?.AccessRules?.filter((rule) =>
        rights.get(rule.Name),
    )?.length;
    const selectedRightsCount = availablePermissions?.AccessRights?.filter((right) =>
        rights.get(right.Name),
    )?.length;
    return (
        <div className={block('view-selector')}>
            <SegmentedRadioGroup value={value} onUpdate={onUpdate}>
                <SegmentedRadioGroup.Option value={'Groups'}>
                    {RightsViewTitle['Groups']}
                    {selectedRulesCount ? (
                        <React.Fragment>
                            &nbsp;
                            {selectedRulesCount}
                        </React.Fragment>
                    ) : null}
                </SegmentedRadioGroup.Option>
                <SegmentedRadioGroup.Option value={'Granular'}>
                    {RightsViewTitle['Granular']}&nbsp;
                    {selectedRightsCount ? (
                        <React.Fragment>&nbsp;{selectedRightsCount}</React.Fragment>
                    ) : null}
                </SegmentedRadioGroup.Option>
            </SegmentedRadioGroup>
        </div>
    );
}
