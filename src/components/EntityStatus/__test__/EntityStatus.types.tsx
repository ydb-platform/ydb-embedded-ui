import {EFlag} from '../../../types/api/enums';
import {EntityStatus} from '../EntityStatus';

const commonProps = {
    status: EFlag.Red,
    className: 'status',
    size: 's',
    iconSize: 12,
    qa: 'status',
} as const;
const contentProps = {
    onClick: () => {},
    children: 'Cluster',
    endContent: 'extra',
    note: 'Details',
    withStatusName: false,
};

<EntityStatus.Label {...commonProps} {...contentProps} />;
<EntityStatus.Label {...commonProps} {...contentProps} view="default" />;
<EntityStatus.Label {...commonProps} view="compact" />;

<EntityStatus.Label
    {...commonProps}
    view="compact"
    onClick={contentProps.onClick}
    aria-label="Open healthcheck details"
    checkIcon="check"
/>;
<EntityStatus.Label {...commonProps} view="compact" tabIndex={0} checkIcon="circle-check" />;
// @ts-expect-error Compact labels do not render children.
<EntityStatus.Label {...commonProps} view="compact" children={contentProps.children} />;
// @ts-expect-error Compact labels do not render trailing content.
<EntityStatus.Label {...commonProps} view="compact" endContent={contentProps.endContent} />;
// @ts-expect-error Compact labels do not render a HelpMark.
<EntityStatus.Label {...commonProps} view="compact" note={contentProps.note} />;
// @ts-expect-error Compact labels never render an inline status name.
<EntityStatus.Label {...commonProps} view="compact" withStatusName={false} />;

<EntityStatus.Label {...commonProps} view="compact" {...{onClick: contentProps.onClick}} />;
// @ts-expect-error Spreading props must not introduce children.
<EntityStatus.Label {...commonProps} view="compact" {...{children: contentProps.children}} />;
// @ts-expect-error Spreading props must not introduce trailing content.
<EntityStatus.Label {...commonProps} view="compact" {...{endContent: contentProps.endContent}} />;
// @ts-expect-error Spreading props must not introduce a HelpMark.
<EntityStatus.Label {...commonProps} view="compact" {...{note: contentProps.note}} />;
// @ts-expect-error Spreading props must not introduce an inline status name.
<EntityStatus.Label {...commonProps} view="compact" {...{withStatusName: false}} />;
