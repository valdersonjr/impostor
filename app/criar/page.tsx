import { Suspense } from 'react';
import HostRoom from './HostRoom';

export default function CriarPage() {
  return (
    <Suspense fallback={<div className="h-full bg-void" />}>
      <HostRoom />
    </Suspense>
  );
}
