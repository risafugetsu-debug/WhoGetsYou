'use client';

import { useRef } from 'react';

export interface ExistingPhoto {
  id: string;
  signedUrl: string;
}

interface PhotoUploadStepProps {
  title: string;
  description: string;
  hint?: string;
  optional?: boolean;
  minPhotos?: number;
  maxPhotos?: number;
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  newPhotos: File[];
  onNewPhotosChange: (photos: File[]) => void;
  error?: string;
}

export default function PhotoUploadStep({
  title,
  description,
  hint,
  optional = false,
  minPhotos,
  maxPhotos = 10,
  existingPhotos = [],
  onRemoveExisting,
  newPhotos,
  onNewPhotosChange,
  error,
}: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveMin = minPhotos ?? (optional ? 0 : 1);
  const totalCount = existingPhotos.length + newPhotos.length;
  const canAddMore = totalCount < maxPhotos;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = maxPhotos - totalCount;
    onNewPhotosChange([...newPhotos, ...images.slice(0, remaining)]);
  }

  function removeNew(index: number) {
    onNewPhotosChange(newPhotos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-medium text-[var(--color-charcoal)]">{title}</h3>
          {optional && (
            <span className="text-xs text-[var(--color-muted)]">optional</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{description}</p>
        {hint && (
          <p className="mt-1 text-xs text-[var(--color-muted)] italic">{hint}</p>
        )}
        {!optional && effectiveMin > 0 && (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            At least {effectiveMin} photo required
          </p>
        )}
      </div>

      {(existingPhotos.length > 0 || newPhotos.length > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {existingPhotos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.signedUrl} alt="Gown photo" className="h-full w-full object-cover" />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(photo.id)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {newPhotos.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`New photo ${i + 1}`} className="h-full w-full object-cover" />
                <div className="absolute left-1.5 top-1.5 rounded-full bg-[var(--color-rose)] px-1.5 py-0.5 text-[10px] text-white">New</div>
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {canAddMore && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-4 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
          >
            + Add {totalCount > 0 ? 'more ' : ''}photos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
