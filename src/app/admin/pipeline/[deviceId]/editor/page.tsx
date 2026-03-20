'use client';

import { useParams } from 'next/navigation';
import PanelEditor from '@/components/panel-editor/PanelEditor';

export default function EditorPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  if (!deviceId) return null;
  return <PanelEditor deviceId={deviceId} />;
}
