import {Graph, GraphState, CanvasBlock} from '@gravity-ui/graph';

export class QueryBlockView extends CanvasBlock {
    protected renderStroke(color: string) {
        this.context.ctx.lineWidth = Math.round(3 / this.context.camera.getCameraScale());
        this.context.ctx.strokeStyle = color;
        this.context.ctx.stroke();
    }

    public override renderSchematicView(ctx: CanvasRenderingContext2D) {
        // Draw circle with shadow
        this.context.ctx.save();
        this.context.ctx.shadowOffsetX = 1;
        this.context.ctx.shadowOffsetY = 1;
        this.context.ctx.shadowBlur = 5;
        this.context.ctx.shadowColor = 'rgba(0,0,0,0.15)';
        this.context.ctx.fillStyle = this.context.colors.block?.background;
        this.context.ctx.beginPath();
        const centerX = this.state.x + this.state.width / 2;
        const centerY = this.state.y + this.state.height / 2;
        this.context.ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        this.context.ctx.fill();
        this.context.ctx.restore();

        this.context.ctx.restore();

        this.context.ctx.globalAlpha = 1;
    }
}
