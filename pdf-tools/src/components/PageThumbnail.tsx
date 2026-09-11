import React from "react";
import { RotateCw, Trash2, Check } from "lucide-react";

interface PageThumbnailProps {
  pageNumber: number;
  rotation?: number;
  isSelected?: boolean;
  isMarkedForRemoval?: boolean;
  onToggleSelect?: () => void;
  onRotate?: () => void;
  onRemove?: () => void;
  showRotateAction?: boolean;
  showRemoveAction?: boolean;
  showSelectCheckbox?: boolean;
  badgeText?: string;
  orderNumber?: number;
  isLandscape?: boolean;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pageNumber,
  rotation = 0,
  isSelected,
  isMarkedForRemoval,
  onToggleSelect,
  onRotate,
  onRemove,
  showRotateAction = false,
  showRemoveAction = false,
  showSelectCheckbox = false,
  badgeText,
  orderNumber,
  isLandscape = false,
}) => {
  // Normalize rotation angle
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  return (
    <div
      id={`page-thumb-card-${pageNumber}`}
      onClick={onToggleSelect}
      className={`relative group flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer select-none ${
        isMarkedForRemoval
          ? "border-red-400 bg-red-50/50 opacity-60"
          : isSelected
          ? "border-red-600 bg-red-50/30 ring-2 ring-red-500/20 shadow-sm"
          : "border-zinc-200 hover:border-zinc-300 bg-white hover:shadow-md"
      }`}
    >
      {/* Top badges / order indicator */}
      <div className="w-full flex items-center justify-between mb-2 text-xs">
        <span className="font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
          {orderNumber !== undefined ? `#${orderNumber} (P.${pageNumber})` : `Page ${pageNumber}`}
        </span>

        {badgeText && (
          <span className="text-[11px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
            {badgeText}
          </span>
        )}

        {showSelectCheckbox && (
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              isSelected ? "bg-red-600 text-white" : "border border-zinc-300 bg-white"
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        )}
      </div>

      {/* Page Sheet Canvas Representation */}
      <div className="relative w-36 h-48 bg-zinc-50 rounded border border-zinc-200 overflow-hidden flex flex-col shadow-inner justify-between p-2.5">
        {/* Animated container for visual rotation */}
        <div
          className="w-full h-full flex flex-col justify-between transition-transform duration-300"
          style={{ transform: `rotate(${normalizedRotation}deg)` }}
        >
          {/* Header simulation */}
          <div>
            <div className="h-2 w-12 bg-red-400 rounded-sm mb-1.5" />
            <div className="h-1.5 w-24 bg-zinc-200 rounded-sm mb-1" />
            <div className="h-1.5 w-16 bg-zinc-200 rounded-sm" />
          </div>

          {/* Body lines simulation */}
          <div className="space-y-1 my-auto">
            <div className="h-1 w-full bg-zinc-200/80 rounded" />
            <div className="h-1 w-5/6 bg-zinc-200/80 rounded" />
            <div className="h-1 w-4/6 bg-zinc-200/80 rounded" />
            <div className="h-1 w-full bg-zinc-200/80 rounded" />
            <div className="h-1 w-3/4 bg-zinc-200/80 rounded" />
          </div>

          {/* Footer simulation */}
          <div className="flex justify-between items-center pt-1 border-t border-zinc-200/60 text-[9px] text-zinc-400">
            <span>Doc</span>
            <span>p. {pageNumber}</span>
          </div>
        </div>

        {/* Marked for removal overlay */}
        {isMarkedForRemoval && (
          <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
              Remove
            </div>
          </div>
        )}

        {/* Hover / Direct Page Action Buttons */}
        <div
          className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg border border-zinc-200 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {showRotateAction && onRotate && (
            <button
              id={`rotate-btn-${pageNumber}`}
              type="button"
              onClick={onRotate}
              title="Rotate 90°"
              className="p-1 hover:bg-zinc-100 rounded text-zinc-700 hover:text-red-600 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {showRemoveAction && onRemove && (
            <button
              id={`remove-btn-${pageNumber}`}
              type="button"
              onClick={onRemove}
              title="Remove this page"
              className="p-1 hover:bg-red-50 rounded text-zinc-700 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Rotation label if rotated */}
      {normalizedRotation !== 0 && (
        <span className="mt-1 text-[11px] font-medium text-zinc-500">
          Rotated {normalizedRotation}°
        </span>
      )}
    </div>
  );
};
