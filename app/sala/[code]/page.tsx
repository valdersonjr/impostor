import { Suspense } from 'react';
import PlayerRoom from './PlayerRoom';

export default function SalaPage() {
  return (
    <Suspense fallback={<div className="h-full bg-void" />}>
      <PlayerRoom />
    </Suspense>
  );
}
