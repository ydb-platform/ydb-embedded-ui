import {Component} from '@gravity-ui/graph';

interface FullViewportBackgroundContext extends Record<string, unknown> {
    camera: {
        getCameraState(): {
            relativeX: number;
            relativeY: number;
            relativeWidth: number;
            relativeHeight: number;
            scale: number;
        };
    };
    colors: {
        canvas: {
            dots: string;
            layerBackground: string;
        };
    };
    constants: {
        block: {
            SCALES: number[];
        };
        system: {
            GRID_SIZE: number;
        };
    };
    ctx: CanvasRenderingContext2D;
}

const VIEWPORT_PADDING = 10;
const DOT_SIZE = 2;
const LARGE_DOT_MULTIPLIER = 3;
const PATTERN_GRID_SIZE = 5;

class FullViewportBackgroundComponent extends Component {
    private patterns?: {normal: CanvasPattern; simple: CanvasPattern};
    private patternsColor?: string;
    private patternsGridSize?: number;

    protected render() {
        const {camera, colors, constants, ctx} = this.context as FullViewportBackgroundContext;
        const cameraState = camera.getCameraState();
        const x = -cameraState.relativeX - VIEWPORT_PADDING;
        const y = -cameraState.relativeY - VIEWPORT_PADDING;
        const width = cameraState.relativeWidth + VIEWPORT_PADDING * 2;
        const height = cameraState.relativeHeight + VIEWPORT_PADDING * 2;

        ctx.fillStyle = colors.canvas.layerBackground;
        ctx.fillRect(x, y, width, height);

        if (cameraState.scale < constants.block.SCALES[0]) {
            return;
        }

        this.preparePatterns(colors.canvas.dots, constants.system.GRID_SIZE);
        if (!this.patterns) {
            return;
        }

        ctx.fillStyle =
            cameraState.scale > constants.block.SCALES[2]
                ? this.patterns.normal
                : this.patterns.simple;
        ctx.fillRect(x, y, width, height);
    }

    private preparePatterns(color: string, gridSize: number) {
        if (this.patterns && this.patternsColor === color && this.patternsGridSize === gridSize) {
            return;
        }

        const normal = this.createPattern(color, gridSize, false);
        const simple = this.createPattern(color, gridSize, true);

        if (normal && simple) {
            this.patterns = {normal, simple};
            this.patternsColor = color;
            this.patternsGridSize = gridSize;
        }
    }

    private createPattern(color: string, gridSize: number, simple: boolean) {
        const {ctx} = this.context as FullViewportBackgroundContext;
        const patternCanvas = document.createElement('canvas');
        const patternSize = PATTERN_GRID_SIZE * gridSize;
        patternCanvas.width = patternSize;
        patternCanvas.height = patternSize;

        const patternContext = patternCanvas.getContext('2d');
        if (!patternContext) {
            return null;
        }

        patternContext.fillStyle = color;

        for (let row = -1; row <= PATTERN_GRID_SIZE; row += 1) {
            for (let column = -1; column <= PATTERN_GRID_SIZE; column += 1) {
                if (row % PATTERN_GRID_SIZE === 0 && column % PATTERN_GRID_SIZE === 0) {
                    const largeDotSize = DOT_SIZE * LARGE_DOT_MULTIPLIER;
                    patternContext.fillRect(
                        row * gridSize - largeDotSize / 2,
                        column * gridSize - largeDotSize / 2,
                        largeDotSize,
                        largeDotSize,
                    );
                } else if (!simple) {
                    patternContext.fillRect(
                        row * gridSize - DOT_SIZE / 2,
                        column * gridSize - DOT_SIZE / 2,
                        DOT_SIZE,
                        DOT_SIZE,
                    );
                }
            }
        }

        return ctx.createPattern(patternCanvas, 'repeat');
    }
}

export const FullViewportBackground =
    FullViewportBackgroundComponent as unknown as typeof Component;
