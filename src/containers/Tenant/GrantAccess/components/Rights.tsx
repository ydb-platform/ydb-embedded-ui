import {Card, Flex, Label, Switch, Text} from '@gravity-ui/uikit';

import type {AvailablePermissionsConfig} from '../../../../types/api/acl';
import i18n from '../i18n';
import type {CommonRightsProps, RightsView} from '../shared';
import {RightsDescription, block, isLegacyRight} from '../shared';

interface RightsProps extends CommonRightsProps {
    availablePermissions?: AvailablePermissionsConfig;
    view: RightsView;
}

export function Rights({
    rights,
    availablePermissions,
    handleChangeRightGetter,
    inheritedRights,
    view,
}: RightsProps) {
    if (view === 'Groups') {
        return (
            <GroupRights
                rights={rights}
                availablePermissions={availablePermissions?.AccessRules}
                handleChangeRightGetter={handleChangeRightGetter}
                inheritedRights={inheritedRights}
            />
        );
    }
    return (
        <GranularRights
            rights={rights}
            availablePermissions={availablePermissions?.AccessRights}
            handleChangeRightGetter={handleChangeRightGetter}
            inheritedRights={inheritedRights}
        />
    );
}

interface GroupRightsProps extends CommonRightsProps {
    availablePermissions: AvailablePermissionsConfig['AccessRules'];
}

function GroupRights({
    rights,
    availablePermissions,
    handleChangeRightGetter,
    inheritedRights,
}: GroupRightsProps) {
    if (!availablePermissions?.length) {
        return i18n('description_no-group-permissions');
    }
    return (
        <Flex gap={3} direction="column">
            {availablePermissions.map(({Name, Mask, AccessRights = [], AccessRules = []}) => {
                const includedRights = AccessRights.concat(AccessRules);
                const isLegacy = isLegacyRight(Mask);
                const isActive = rights.get(Name);
                const isInherited = inheritedRights.has(Name);

                if (isLegacy && !isActive && !isInherited) {
                    return null;
                }

                return (
                    <SingleRight
                        active={isActive}
                        key={Name}
                        right={Name}
                        onUpdate={handleChangeRightGetter(Name)}
                        includedRights={includedRights}
                        description={RightsDescription[Mask]}
                        inherited={isInherited}
                    />
                );
            })}
        </Flex>
    );
}

interface GranularRightsProps extends CommonRightsProps {
    availablePermissions: AvailablePermissionsConfig['AccessRights'];
}

function GranularRights({
    rights,
    availablePermissions,
    handleChangeRightGetter,
    inheritedRights,
}: GranularRightsProps) {
    if (!availablePermissions?.length) {
        return i18n('description_no-granular-permissions');
    }
    return (
        <Flex gap={3} direction="column">
            {availablePermissions.map(({Name, Mask}) => (
                <SingleRight
                    key={Name}
                    active={rights.get(Name)}
                    right={Name}
                    onUpdate={handleChangeRightGetter(Name)}
                    description={RightsDescription[Mask]}
                    inherited={inheritedRights.has(Name)}
                />
            ))}
        </Flex>
    );
}

interface SingleRightProps {
    right: string;
    onUpdate: (value: boolean) => void;
    active?: boolean;
    includedRights?: string[];
    description?: string;
    inherited?: boolean;
}

function SingleRight({
    right,
    onUpdate,
    active,
    includedRights,
    description,
    inherited,
}: SingleRightProps) {
    const onlyInherited = inherited && !active;
    return (
        <Card className={block('single-right')} theme={active || inherited ? 'info' : 'normal'}>
            <Flex justifyContent="space-between" alignItems="flex-start" gap={4}>
                <Flex direction="column" gap={2}>
                    <Flex direction="column">
                        <Text variant="subheader-2">{right}</Text>
                        {description && <Text color="secondary">{description}</Text>}
                    </Flex>
                    {includedRights?.length ? (
                        <Flex wrap="wrap" gap={1}>
                            {includedRights.map((right) => (
                                <Label key={right} theme="unknown">
                                    {right}
                                </Label>
                            ))}
                        </Flex>
                    ) : null}
                </Flex>
                <Flex direction="column" gap={2}>
                    {inherited && <Label theme="info">{i18n('label_inherited')}</Label>}
                    {!onlyInherited && <Switch checked={Boolean(active)} onUpdate={onUpdate} />}
                </Flex>
            </Flex>
        </Card>
    );
}
