import {Icon as UiKitIcon} from '@gravity-ui/uikit';

interface IconProps {
    name: string;
    height?: number | string;
    width?: number | string;
    viewBox?: string;
    className?: string;
    onClick?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
}

export const Icon = ({
    name,
    height = 16,
    width = 16,
    viewBox = '0 0 16 16',
    className,
    onClick,
}: IconProps) => {
    return (
        <UiKitIcon
            // @ts-expect-error
            // Both url and id strings are required in this uikit component.
            // However, if no url provided, component uses id, which is what we need.
            // If it is fixed in uikit it could be safely removed
            data={{id: `icon.${name}`, viewBox}}
            height={height}
            width={width}
            className={className}
            onClick={onClick}
        />
    );
};

Icon.displayName = 'Icon';
