'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onCreated: (deviceId: string) => void;
}

export default function UploadZone({ onCreated }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [budgetCapUsd, setBudgetCapUsd] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setError(null);
    } else {
      setError('Please drop a PDF file');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName || !manufacturer) {
      setError('Device name and manufacturer are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('deviceName', deviceName);
      formData.append('manufacturer', manufacturer);
      formData.append('budgetCapUsd', String(budgetCapUsd));
      if (file) formData.append('manual', file);

      const res = await fetch('/api/pipeline', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create pipeline');
        return;
      }

      onCreated(data.deviceId);
    } catch {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
        New Pipeline
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-[var(--accent)] bg-[var(--accent)]/5'
              : file
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-[var(--card-border)] hover:border-gray-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-sm text-gray-400">
            {file ? file.name : 'Drop manual PDF here or click to browse'}
          </span>
        </div>

        {/* Form fields */}
        <input
          type="text"
          placeholder="Device name (e.g. DeepMind 12)"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-gray-500 outline-none focus:border-[var(--accent)]"
        />

        <input
          type="text"
          placeholder="Manufacturer (e.g. Behringer)"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-gray-500 outline-none focus:border-[var(--accent)]"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Budget cap: $</label>
          <input
            type="number"
            min={1}
            max={500}
            value={budgetCapUsd}
            onChange={(e) => setBudgetCapUsd(Number(e.target.value))}
            className="w-20 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !deviceName || !manufacturer}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isSubmitting ? 'Creating...' : 'Create Pipeline'}
        </button>
      </form>
    </motion.div>
  );
}
