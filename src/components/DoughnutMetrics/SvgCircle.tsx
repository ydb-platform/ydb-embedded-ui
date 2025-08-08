interface SvgCircleProps {
    cx: number;
    cy: number;
    r: number;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    strokeDashoffset?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    fill?: string;
    className?: string;
}

export function SvgCircle({
    cx,
    cy,
    r,
    stroke,
    strokeWidth,
    strokeDasharray,
    strokeDashoffset,
    strokeLinecap = 'butt',
    fill = 'none',
    className,
}: SvgCircleProps) {
    return (
        <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap={strokeLinecap}
            className={className}
        />
    );
}
