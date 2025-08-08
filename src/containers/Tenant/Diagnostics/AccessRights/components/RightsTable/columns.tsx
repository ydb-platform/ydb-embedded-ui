import type {Column} from '@gravity-ui/react-data-table';
import {Flex, Label} from '@gravity-ui/uikit';

import {SubjectWithAvatar} from '../../../../../../components/SubjectWithAvatar/SubjectWithAvatar';
import {TitleWithHelpMark} from '../../../../../../components/TitleWithHelpmark/TitleWithHelpmark';
import type {PreparedAccessRights} from '../../../../../../types/api/acl';
import i18n from '../../i18n';
import {block} from '../../shared';

import {SubjectActions} from './Actions';

export const columns: Column<PreparedAccessRights>[] = [
    {
        name: 'subject',
        width: 210,
        get header() {
            return i18n('label_subject');
        },
        render: ({row: {subject}}) => {
            return <SubjectWithAvatar subject={subject} />;
        },
    },
    {
        name: 'explicit',
        width: 400,
        get header() {
            return (
                <TitleWithHelpMark
                    header={i18n('label_explicit-rights')}
                    note={i18n('description_explicit-rights')}
                />
            );
        },
        render: ({row: {subject, explicit}}) => {
            return (
                <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    className={block('rights-wrapper')}
                >
                    <Flex gap={2} wrap="wrap">
                        {explicit.map((right) => (
                            <Label theme="normal" key={right} size="xs">
                                {right}
                            </Label>
                        ))}
                    </Flex>
                    <SubjectActions subject={subject} className={block('rights-actions')} />
                </Flex>
            );
        },
        sortable: false,
    },
    {
        name: 'effective',
        width: 400,
        get header() {
            return (
                <TitleWithHelpMark
                    header={i18n('label_effective-rights')}
                    note={i18n('description_effective-rights')}
                />
            );
        },
        render: ({row: {effective}}) => {
            return (
                <Flex gap={2} wrap="wrap">
                    {effective.map((right) => (
                        <Label theme="unknown" key={right} size="xs">
                            {right}
                        </Label>
                    ))}
                </Flex>
            );
        },
        sortable: false,
    },
];
