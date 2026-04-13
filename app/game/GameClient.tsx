'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Phase = 'idle' | 'revealed' | 'finished';
type FlashType = 'none' | 'red' | 'white';

interface Player {
  id: number;
  isImpostor: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Eye SVG ─────────────────────────────────────────────────── */
function EyeClosed() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className="w-20 h-20 opacity-30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 32 C16 20 48 20 56 32"
        stroke="#888888"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M16 26 L12 18" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 22 L26 14" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 22 L42 14" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 26 L54 18" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Idle screen ─────────────────────────────────────────────── */
function IdleScreen({ playerNumber }: { playerNumber: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-10 animate-fade-in">
      <p
        className="text-xs tracking-[0.35em] uppercase"
        style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}
      >
        vez de
      </p>
      <h2
        className="font-cinzel font-bold tracking-[0.3em] text-4xl"
        style={{ color: '#b8860b' }}
      >
        JOGADOR {playerNumber}
      </h2>
      <div
        className="w-24 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #2a2a2a, transparent)' }}
      />
      <EyeClosed />
      <div className="flex flex-col items-center gap-2" style={{ color: '#444444' }}>
        <p className="text-sm tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
          Toque para ver
        </p>
        <p className="text-sm tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
          sua missão
        </p>
      </div>
    </div>
  );
}

/* ── Innocent screen ─────────────────────────────────────────── */
function InnocentScreen({ word, canContinue }: { word: string; canContinue: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-8 animate-scale-in">
      <p
        className="text-xs tracking-[0.3em] uppercase"
        style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}
      >
        Você conhece a palavra
      </p>
      <div
        className="w-20 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #1f1f1f, transparent)' }}
      />
      <p
        className="font-cinzel font-bold text-center leading-tight"
        style={{
          fontSize: 'clamp(2.5rem, 12vw, 5rem)',
          color: '#f0ede6',
          letterSpacing: '0.05em',
          wordBreak: 'break-word',
        }}
      >
        {word.toUpperCase()}
      </p>
      <div
        className={`absolute bottom-10 text-xs tracking-[0.25em] uppercase transition-opacity duration-500 ${
          canContinue ? 'opacity-40' : 'opacity-0'
        }`}
        style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}
      >
        toque para continuar
      </div>
    </div>
  );
}

/* ── Impostor screen ─────────────────────────────────────────── */
function ImpostorScreen({ canContinue }: { canContinue: boolean }) {
  return (
    <>
      <div className="relative flex flex-col items-center justify-center gap-6 px-8 animate-scale-in">
        <p
          className="text-xs tracking-[0.35em] uppercase"
          style={{ color: '#c41e1eaa', fontFamily: 'var(--font-inter)' }}
        >
          Você é o
        </p>
        <h2
          className="font-cinzel font-black animate-blood-pulse animate-flicker"
          style={{
            fontSize: 'clamp(2.8rem, 13vw, 5.5rem)',
            color: '#c41e1e',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          IMPOSTOR
        </h2>
        <div
          className="w-32 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #c41e1e40, transparent)' }}
        />
        <p
          className="text-xs tracking-[0.2em] uppercase mt-1"
          style={{ color: '#c41e1e99', fontFamily: 'var(--font-inter)' }}
        >
          Finja que sabe a palavra
        </p>
        <div
          className={`fixed bottom-10 text-xs tracking-[0.25em] uppercase transition-opacity duration-500 ${
            canContinue ? 'opacity-40' : 'opacity-0'
          }`}
          style={{ color: '#c41e1e80', fontFamily: 'var(--font-inter)' }}
        >
          toque para continuar
        </div>
      </div>
    </>
  );
}

/* ── Finished screen ─────────────────────────────────────────── */
function FinishedScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-8 animate-fade-up">
      <h2
        className="font-cinzel font-bold tracking-[0.3em] text-center"
        style={{ fontSize: '2rem', color: '#b8860b' }}
      >
        TODOS PRONTOS
      </h2>
      <div
        className="w-24 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #b8860b, transparent)' }}
      />
      <div className="flex flex-col items-center gap-2" style={{ color: '#555555' }}>
        <p
          className="text-base tracking-widest"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Boa sorte.
        </p>
        <p
          className="text-sm tracking-wider"
          style={{ fontFamily: 'var(--font-inter)', color: '#3a3a3a' }}
        >
          Não confie em ninguém.
        </p>
      </div>
      <button
        onClick={onRestart}
        className="mt-8 px-10 py-4 font-cinzel font-bold tracking-[0.3em] text-xs transition-all duration-200 active:scale-95"
        style={{
          border: '1px solid #1f1f1f',
          color: '#555555',
          background: '#111111',
        }}
      >
        NOVO JOGO
      </button>
    </div>
  );
}

/* ── Flash overlay ───────────────────────────────────────────── */
function Flash({ type }: { type: FlashType }) {
  if (type === 'none') return null;
  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none ${
        type === 'red' ? 'animate-red-flash' : 'animate-white-flash'
      }`}
    />
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function GameClient() {
  const params = useSearchParams();
  const router = useRouter();

  const totalPlayers = parseInt(params.get('players') ?? '4');
  const totalImpostors = parseInt(params.get('impostors') ?? '1');

  const [players, setPlayers] = useState<Player[]>([]);
  const [word, setWord] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [canContinue, setCanContinue] = useState(false);
  const [flash, setFlash] = useState<FlashType>('none');
  const [flashing, setFlashing] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Prevent screen sleep during the distribution phase */
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
    }
    return () => { lock?.release(); };
  }, []);

  /* Initialise game data */
  useEffect(() => {
    const init = async () => {
      const res = await fetch('/palavras.txt');
      const text = await res.text();
      const words = text.split('\n').map((w) => w.trim()).filter(Boolean);
      const chosen = words[Math.floor(Math.random() * words.length)];
      setWord(chosen);

      const roles: Player[] = Array.from({ length: totalPlayers }, (_, i) => ({
        id: i + 1,
        isImpostor: false,
      }));

      const shuffled = shuffle(roles);
      for (let i = 0; i < totalImpostors; i++) shuffled[i].isImpostor = true;

      /* Re-sort by id so player 1 goes first */
      const final = shuffle(shuffled).map((p, idx) => ({ ...p, id: idx + 1 }));
      setPlayers(final);
      setLoading(false);
    };
    init();
  }, [totalPlayers, totalImpostors]);

  /* Enable "tap to continue" after 1.5 s when a role is revealed */
  useEffect(() => {
    if (phase !== 'revealed') return;
    setCanContinue(false);
    const t = setTimeout(() => setCanContinue(true), 1500);
    return () => clearTimeout(t);
  }, [phase, currentIndex]);

  const handleTap = useCallback(() => {
    if (loading || flashing) return;

    if (phase === 'idle') {
      const isImpostor = players[currentIndex]?.isImpostor ?? false;
      setFlashing(true);
      setFlash(isImpostor ? 'red' : 'white');
      setTimeout(() => {
        setFlash('none');
        setFlashing(false);
        setPhase('revealed');
      }, 280);
      return;
    }

    if (phase === 'revealed' && canContinue) {
      if (currentIndex + 1 >= players.length) {
        setPhase('finished');
      } else {
        setCurrentIndex((i) => i + 1);
        setPhase('idle');
      }
    }
  }, [loading, flashing, phase, players, currentIndex, canContinue]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className="w-1 h-8 animate-pulse"
          style={{ background: '#c41e1e' }}
        />
      </div>
    );
  }

  const isFinished = phase === 'finished';

  return (
    <div
      className={`grain relative h-full w-full flex items-center justify-center overflow-hidden ${
        isFinished ? '' : 'cursor-pointer'
      }`}
      onClick={isFinished ? undefined : handleTap}
    >
      <Flash type={flash} />

      {phase === 'idle' && (
        <IdleScreen playerNumber={players[currentIndex]?.id ?? currentIndex + 1} />
      )}

      {phase === 'revealed' && !players[currentIndex]?.isImpostor && (
        <InnocentScreen word={word} canContinue={canContinue} />
      )}

      {phase === 'revealed' && players[currentIndex]?.isImpostor && (
        <ImpostorScreen canContinue={canContinue} />
      )}

      {phase === 'finished' && (
        <FinishedScreen onRestart={() => router.push('/')} />
      )}

      {/* Progress dots */}
      {phase !== 'finished' && (
        <div className="absolute bottom-10 flex gap-2">
          {players.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i < currentIndex
                    ? '#333333'
                    : i === currentIndex
                    ? '#b8860b'
                    : '#1a1a1a',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
