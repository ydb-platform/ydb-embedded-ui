const STICK_START = 30;
const STICK_SPACE = 70;
const HEIGHT = 54;
const WIDTH = 268;

const READ_FILL = '#ADE8F5';
const WRITE_FILL = '#f5be9d';

interface DashArcProps {
    width: number;
    height: number;
    transform?: string;
}

const DashArc = ({width, height, transform}: DashArcProps) => (
    <path
        d={`M-${width / 2} 0 c0 -${height}, ${width} -${height}, ${width} 0`}
        fill="none"
        strokeDasharray="4,6"
        stroke="#28f"
        strokeWidth="1.6"
        transform={transform}
    />
);

interface ArrowLineProps {
    width: number;
}

const ArrowLine = ({width}: ArrowLineProps) => (
    <path fill="none" strokeWidth="2" d={`M0 0 h${width} l-10 -5 m0 10 l10 -5`} />
);

const WriteLag = () => (
    <g fill="var(--yc-color-text-primary)" fontSize="12">
        <g transform={`translate(0, ${HEIGHT / 2})`} stroke={WRITE_FILL}>
            <ArrowLine width={STICK_SPACE * 2.9} />
        </g>

        <g transform={`translate(${STICK_START}, 0)`}>
            <g transform={`translate(${STICK_SPACE / 2}, ${HEIGHT / 2})`}>
                <DashArc width={STICK_SPACE} height={15} />
                <text x="0" y="-15" textAnchor="middle">
                    <tspan x="0" dy="0">
                        write lag
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${STICK_SPACE * 1.7}, ${HEIGHT / 2})`}>
                <DashArc width={STICK_SPACE * 1.4} height={15} />
                <text x="0" y="-15" textAnchor="middle">
                    <tspan x="0" dy="0">
                        write idle time
                    </tspan>
                </text>
            </g>
        </g>

        <g transform={`translate(${STICK_START}, 0)`}>
            <g transform={`translate(${0}, ${HEIGHT / 2})`}>
                <use y="-10" xlinkHref="#check" stroke={WRITE_FILL} />
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        create time
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${STICK_SPACE}, ${HEIGHT / 2})`}>
                <use y="-10" xlinkHref="#check" stroke={WRITE_FILL} />
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        write time
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${2.4 * STICK_SPACE}, ${HEIGHT / 2})`}>
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        now
                    </tspan>
                </text>
            </g>
        </g>
    </g>
);

const ReadLag = () => (
    <g fill="var(--yc-color-text-primary)" fontSize="12">
        <g transform={`translate(0, ${HEIGHT / 2})`} stroke={READ_FILL}>
            <ArrowLine width={WIDTH} />
        </g>

        <g transform={`translate(${STICK_START}, 0)`}>
            <g transform={`translate(${STICK_SPACE * 1.5}, ${HEIGHT / 2})`}>
                <DashArc width={STICK_SPACE} height={15} />
                <text x="0" y="-15" textAnchor="middle">
                    <tspan x="0" dy="0">
                        read lag
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${STICK_SPACE / 2}, ${HEIGHT / 2})`}>
                <DashArc width={STICK_SPACE} height={15} />
                <text x="0" y="-15" textAnchor="middle">
                    <tspan x="0" dy="0">
                        write lag
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${STICK_SPACE * 2.6}, ${HEIGHT / 2})`}>
                <DashArc width={STICK_SPACE * 1.3} height={15} />
                <text x="0" y="-15" textAnchor="middle">
                    <tspan x="0" dy="0">
                        read idle time
                    </tspan>
                </text>
            </g>
        </g>

        <g transform={`translate(${STICK_START}, ${HEIGHT / 2})`}>
            <g transform={`translate(${0}, 0)`}>
                <use y="-10" xlinkHref="#check" stroke={READ_FILL} />
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        create time
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${STICK_SPACE}, 0)`}>
                <use y="-10" xlinkHref="#check" stroke={READ_FILL} />
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        write time
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${2 * STICK_SPACE}, 0)`}>
                <use x="-2" y="-10" xlinkHref="#check" stroke={READ_FILL} />
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        read time
                    </tspan>
                </text>
            </g>
            <g transform={`translate(${3.2 * STICK_SPACE}, 0)`}>
                <text x="0" y="20" textAnchor="middle">
                    <tspan x="0" dy="0">
                        now
                    </tspan>
                </text>
            </g>
        </g>
    </g>
);

interface DashPatternProps {
    id: string;
    fill: string;
}

const DashPattern = ({id, fill}: DashPatternProps) => (
    <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 5L5 0H8L0 8V5M5 8L8 5V8Z" fill={fill} />
    </pattern>
);

export const WriteLagImage = () => (
    <svg
        className="paint"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
    >
        <defs>
            <g id="check">
                <path d="M0 3 v14" strokeWidth="2" />
            </g>
            <DashPattern id="latest-read" fill={READ_FILL} />
            <DashPattern id="latest-write" fill={WRITE_FILL} />
        </defs>
        <WriteLag />
    </svg>
);

export const ReadLagImage = () => (
    <svg
        className="paint"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
    >
        <defs>
            <g id="check">
                <path d="M0 3 v14" strokeWidth="2" />
            </g>
            <DashPattern id="latest-read" fill={READ_FILL} />
            <DashPattern id="latest-write" fill={WRITE_FILL} />
        </defs>
        <ReadLag />
    </svg>
);
