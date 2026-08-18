"use client";

import { useRef, useState } from "react";
import { uploadFiles } from "../lib/api";

interface Props {
  onImported: () => void;
}

export default function FileUpload({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ file: string; status: string; error?: string }[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setResults([]);
    try {
      const data = await uploadFiles(Array.from(files));
      setResults(data.results);
      if (data.results.some((r) => r.status === "imported")) onImported();
    } catch (err) {
      setResults([{ file: "upload", status: "error", error: String(err) }]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-trail-lime/40 rounded-xl p-10 text-center cursor-pointer hover:border-trail-lime/80 hover:bg-trail-lime/5 transition-colors"
      >
        <p className="text-trail-lime font-semibold mb-1">
          Drop GPX, TCX, or FIT files here
        </p>
        <p className="text-sm text-gray-400">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".gpx,.tcx,.fit"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && <p className="text-sm text-gray-400 text-center">Importing...</p>}

      {results.length > 0 && (
        <ul className="space-y-1 text-sm">
          {results.map((r, i) => (
            <li key={i} className={r.status === "imported" ? "text-trail-lime" : "text-red-400"}>
              {r.status === "imported" ? "✓" : "✗"} {r.file}
              {r.error && <span className="text-gray-400 ml-2">({r.error})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
