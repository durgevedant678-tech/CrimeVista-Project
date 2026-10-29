import { useRef, useState } from 'react';
import { UploadCloudIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface DropzoneProps {
  accept: string[];
  maxMb: number;
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ accept, maxMb, onFile, disabled }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file && !disabled) onFile(file);
      }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors duration-150',
        dragging ? 'border-primary bg-primary/5' : 'border-line-strong bg-raised/40',
        disabled && 'opacity-60'
      )}>

      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UploadCloudIcon className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-4 text-sm font-medium text-fg">Drop a crime dataset here</p>
      <p className="cv-caption mt-1">
        {accept.join(', ').toUpperCase()} up to {maxMb} MB
      </p>
      <Button className="mt-5" variant="primary" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        className="sr-only"
        aria-label="Choose dataset file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }} />

    </div>);

}