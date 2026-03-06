'use client';

import { useRef } from 'react';

interface MultiPhotoUploadProps {
  mode: 'multi';
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  error?: string;
  title: string;
  description: string;
  minPhotos?: number;
}

interface SinglePhotoUploadProps {
  mode: 'single';
  photo: File | null;
  onPhotoChange: (photo: File | null) => void;
  error?: string;
  title: string;
  description: string;
}

type PhotoUploadStepProps = MultiPhotoUploadProps | SinglePhotoUploadProps;

export default function PhotoUploadStep(props: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (props.mode === 'multi') {
    const { photos, onPhotosChange, error, title, description, minPhotos = 1 } = props;

    function handleFiles(files: FileList | null) {
      if (!files) return;
      // TODO: Replace with Supabase Storage upload when backend is connected
      const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      onPhotosChange([...photos, ...newFiles]);
    }

    function removePhoto(index: number) {
      onPhotosChange(photos.filter((_, i) => i !== index));
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
          {minPhotos > 0 && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              At least {minPhotos} photo required
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-border)] py-12 text-[var(--color-muted)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-charcoal)]"
        >
          <span className="text-3xl">+</span>
          <span className="text-sm">Click to add photos</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((file, i) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gown photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 text-xs"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  const { photo, onPhotoChange, error, title, description } = props;

  function handleFile(files: FileList | null) {
    if (!files || !files[0]) return;
    // TODO: Replace with Supabase Storage upload when backend is connected
    if (files[0].type.startsWith('image/')) {
      onPhotoChange(files[0]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
      </div>

      {photo ? (
        <div className="relative mx-auto w-48">
          <div className="aspect-square overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(photo)}
              alt="Profile photo"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onPhotoChange(null)}
            className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-[var(--color-ivory)] text-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto flex aspect-square w-48 flex-col items-center justify-center gap-3 rounded-full border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-charcoal)]"
        >
          <span className="text-3xl">+</span>
          <span className="text-xs text-center px-4">Add photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
