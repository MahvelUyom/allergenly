"use client";

import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { UploadIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface DropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFile, disabled }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <Card
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-8 py-16 text-center transition-colors",
        dragging ? "border-primary bg-primary-tint" : "border-border",
        disabled && "pointer-events-none opacity-60"
      )}
      elevated={false}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-card bg-primary-tint text-primary">
        <UploadIcon size={26} />
      </span>
      <p className="text-h3 text-charcoal">Drag and drop your menu here</p>
      <p className="text-body text-charcoal/70">or click to browse your files</p>
      <p className="text-micro text-charcoal/56">Supports PDF, JPG, PNG or plain text · up to 20MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </Card>
  );
}
