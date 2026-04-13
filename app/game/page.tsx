import { Suspense } from 'react';
import GameClient from './GameClient';

function Loading() {
  return (
    <div className="h-full flex items-center justify-center bg-void">
      <div className="w-1 h-8 animate-pulse" style={{ background: '#c41e1e' }} />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<Loading />}>
      <GameClient />
    </Suspense>
  );
}
