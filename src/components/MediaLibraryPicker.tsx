import React, { useState } from 'react';
import { MediaLibraryModal, MediaItem } from './MediaLibraryModal';

interface MediaLibraryPickerProps {
  onSelect: (media: MediaItem | MediaItem[]) => void;
  allowMultiple?: boolean;
  accept?: string;
  children: React.ReactNode;
}

export function MediaLibraryPicker({ onSelect, allowMultiple = false, accept = "image/*,video/*", children }: MediaLibraryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {children}
      </div>
      <MediaLibraryModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onSelect}
        allowMultiple={allowMultiple}
        accept={accept}
      />
    </>
  );
}
