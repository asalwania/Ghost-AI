import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { CanvasNodeShape } from "@/types/canvas";

type SvgCanvasNodeShape = Extract<
  CanvasNodeShape,
  "diamond" | "hexagon" | "cylinder"
>;

interface CanvasShapeFrameProps {
  shape: CanvasNodeShape;
  backgroundColor: string;
  textColor?: string;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

const SVG_STROKE_WIDTH = 1.35;

const SHAPE_CONTENT_CLASS: Record<CanvasNodeShape, string> = {
  rectangle: "px-4 py-2",
  diamond: "px-9 py-9",
  circle: "px-3 py-3",
  pill: "px-5 py-2",
  cylinder: "px-5 pb-3 pt-5",
  hexagon: "px-7 py-3",
};

function isSvgShape(shape: CanvasNodeShape): shape is SvgCanvasNodeShape {
  return shape === "diamond" || shape === "hexagon" || shape === "cylinder";
}

function getCssShapeClass(shape: CanvasNodeShape) {
  if (shape === "circle" || shape === "pill") {
    return "rounded-full";
  }

  return "rounded-xl";
}

function renderSvgShape(
  shape: SvgCanvasNodeShape,
  fill: string,
  stroke: string
) {
  const commonProps = {
    fill,
    stroke,
    strokeWidth: SVG_STROKE_WIDTH,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (shape === "diamond") {
    return (
      <polygon
        points="50 2, 98 50, 50 98, 2 50"
        strokeLinejoin="round"
        {...commonProps}
      />
    );
  }

  if (shape === "hexagon") {
    return (
      <polygon
        points="25 3, 75 3, 98 50, 75 97, 25 97, 2 50"
        strokeLinejoin="round"
        {...commonProps}
      />
    );
  }

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M8 22C8 10.95 92 10.95 92 22V78C92 89.05 8 89.05 8 78V22Z"
        {...commonProps}
      />
      <path
        d="M8 22C8 33.05 92 33.05 92 22C92 10.95 8 10.95 8 22Z"
        {...commonProps}
      />
      <path
        d="M8 78C8 89.05 92 89.05 92 78"
        fill="none"
        stroke={stroke}
        strokeWidth={SVG_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
        opacity={0.72}
      />
    </g>
  );
}

export function CanvasShapeFrame({
  shape,
  backgroundColor,
  textColor,
  selected = false,
  children,
  className,
  contentClassName,
}: CanvasShapeFrameProps) {
  const strokeColor = selected
    ? "var(--accent-primary)"
    : "var(--border-default)";

  if (isSvgShape(shape)) {
    return (
      <div
        className={cn(
          "relative h-full w-full text-center text-sm font-medium",
          className
        )}
        style={{ color: textColor }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible drop-shadow-lg transition-colors duration-150"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {renderSvgShape(shape, backgroundColor, strokeColor)}
        </svg>
        {children ? (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              SHAPE_CONTENT_CLASS[shape],
              contentClassName
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center border text-center text-sm font-medium shadow-lg transition-colors duration-150",
        getCssShapeClass(shape),
        selected ? "border-brand" : "border-surface-border",
        SHAPE_CONTENT_CLASS[shape],
        className
      )}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {children}
    </div>
  );
}
