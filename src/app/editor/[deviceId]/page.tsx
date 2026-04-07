'use client';

import { useParams } from 'next/navigation';
import PanelEditor from '@/components/panel-editor/PanelEditor';

/** Hosted editor page — wraps the existing PanelEditor for contractor use */
export default function HostedEditorPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  if (!deviceId) return null;
  return <PanelEditor deviceId={deviceId} />;
}
