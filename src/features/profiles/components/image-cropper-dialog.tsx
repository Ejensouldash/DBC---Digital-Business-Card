"use client";

import {
  CheckIcon,
  Loader2Icon,
  RotateCcwIcon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { blobToFile, getCroppedImg } from "../lib/crop-image";

export type AspectRatioOption = {
  label: string;
  value: number;
};

export type ImageCropperDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  fileName?: string;
  title?: string;
  description?: string;
  aspect?: number;
  cropShape?: "rect" | "round";
  aspectOptions?: AspectRatioOption[];
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
};

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  fileName = "image.webp",
  title = "Edit Image",
  description = "Drag to reposition the image, adjust zoom, or rotate before saving.",
  aspect = 1,
  cropShape = "rect",
  aspectOptions,
  onCropComplete,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentAspect, setCurrentAspect] = useState(aspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  // Sync aspect if prop changes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset state on close
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCurrentAspect(aspect);
    }
    onOpenChange(nextOpen);
  };

  const onCropChangeCallback = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChangeCallback = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    [],
  );

  const rotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCurrentAspect(aspect);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const file = blobToFile(blob, fileName);
      const previewUrl = URL.createObjectURL(blob);
      onCropComplete(file, previewUrl);
      handleOpenChange(false);
    } catch (err) {
      console.error("Failed to crop image:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Cropper viewport */}
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black/90 ring-1 ring-border sm:h-80 md:h-96">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={currentAspect}
              cropShape={cropShape}
              showGrid
              onCropChange={onCropChangeCallback}
              onZoomChange={onZoomChangeCallback}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteCallback}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              No image to display
            </div>
          )}
        </div>

        {/* Aspect ratio selector if multiple options are provided */}
        {aspectOptions && aspectOptions.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Nisbah / Aspect:</span>
            {aspectOptions.map((opt) => (
              <Button
                key={opt.label}
                type="button"
                variant={currentAspect === opt.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCurrentAspect(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        ) : null}

        {/* Controls: Zoom & Rotate */}
        <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Zoom slider */}
          <div className="flex flex-1 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              aria-label="Zoom out"
            >
              <ZoomOutIcon className="size-4" />
            </Button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              aria-label="Zoom level"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              aria-label="Zoom in"
            >
              <ZoomInIcon className="size-4" />
            </Button>
          </div>

          {/* Action buttons: Rotate & Reset */}
          <div className="flex items-center justify-end gap-1 border-t border-border/50 pt-2 sm:border-t-0 sm:pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={rotate90}
              className="gap-1 text-xs"
            >
              <RotateCwIcon className="size-3.5" />
              <span>Rotate 90°</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="gap-1 text-xs text-muted-foreground"
            >
              <RotateCcwIcon className="size-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={processing}
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="button" disabled={processing || !imageSrc} onClick={handleSave}>
            {processing ? (
              <Loader2Icon className="mr-1.5 size-4 animate-spin" />
            ) : (
              <CheckIcon className="mr-1.5 size-4" />
            )}
            Simpan & Gunakan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
