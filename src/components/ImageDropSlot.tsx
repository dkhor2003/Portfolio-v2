import { useEffect, useState } from 'react';

/** Drag-and-drop image placeholder; persists the dropped image (as a data URL) in localStorage per id. */
export default function ImageDropSlot({ id, placeholder, className }: { id: string; placeholder: string; className?: string }) {
  const storageKey = `image-slot:${id}`;
  const [src, setSrc] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setSrc(saved);
  }, [storageKey]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSrc(result);
      localStorage.setItem(storageKey, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-card border ${over ? 'border-accent' : 'border-line'} flex items-center justify-center ${className ?? ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <label className="cursor-pointer text-center px-4 text-xs font-mono text-dim">
          {placeholder}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
      )}
    </div>
  );
}
