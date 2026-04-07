'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import PanelEditor from '@/components/panel-editor/PanelEditor';

export default function HostedEditorPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  if (!deviceId) return null;
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-2 h-9 border-b border-gray-800 bg-[#0d0d1a] px-3">
        <Link href="/editor" className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
          ← All Panels
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <PanelEditor deviceId={deviceId} />
      </div>
    </div>
  );
}
