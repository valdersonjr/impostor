'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Phase = 'idle' | 'revealed' | 'finished';
type Lang = 'pt' | 'en';

interface Player {
  id: number;
  isImpostor: boolean;
}

const T = {
  pt: {
    turnOf: 'vez de',
    player: 'JOGADOR',
    tapToSee: 'Toque para ver',
    yourRole: 'sua missão',
    youKnowTheWord: 'Você conhece a palavra',
    tapToContinue: 'toque para continuar',
    youAreThe: 'Você é o',
    pretend: 'Finja que sabe a palavra',
    impostor: 'IMPOSTOR',
    allReady: 'TODOS PRONTOS',
    goodLuck: 'Boa sorte.',
    trustNoOne: 'Não confie em ninguém.',
    newGame: 'NOVO JOGO',
  },
  en: {
    turnOf: 'player',
    player: 'PLAYER',
    tapToSee: 'Tap to see',
    yourRole: 'your role',
    youKnowTheWord: 'You know the word',
    tapToContinue: 'tap to continue',
    youAreThe: 'You are the',
    pretend: 'Pretend you know the word',
    impostor: 'IMPOSTOR',
    allReady: 'ALL READY',
    goodLuck: 'Good luck.',
    trustNoOne: 'Trust no one.',
    newGame: 'NEW GAME',
  },
};

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
function IdleScreen({ playerNumber, t }: { playerNumber: number; t: typeof T['pt'] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-10 animate-fade-in">
      <p
        className="text-xs tracking-[0.35em] uppercase"
        style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}
      >
        {t.turnOf}
      </p>
      <h2
        className="font-cinzel font-bold tracking-[0.3em] text-4xl"
        style={{ color: '#b8860b' }}
      >
        {t.player} {playerNumber}
      </h2>
      <div
        className="w-24 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #2a2a2a, transparent)' }}
      />
      <EyeClosed />
      <div className="flex flex-col items-center gap-2" style={{ color: '#444444' }}>
        <p className="text-sm tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
          {t.tapToSee}
        </p>
        <p className="text-sm tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
          {t.yourRole}
        </p>
      </div>
    </div>
  );
}

/* ── Innocent screen ─────────────────────────────────────────── */
function InnocentScreen({ word, canContinue, t }: { word: string; canContinue: boolean; t: typeof T['pt'] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-8 animate-scale-in">
      <p
        className="text-xs tracking-[0.3em] uppercase"
        style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}
      >
        {t.youKnowTheWord}
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
        {t.tapToContinue}
      </div>
    </div>
  );
}

/* ── Impostor screen ─────────────────────────────────────────── */
function ImpostorScreen({ canContinue, t }: { canContinue: boolean; t: typeof T['pt'] }) {
  return (
    <>
      <div className="relative flex flex-col items-center justify-center gap-6 px-8 animate-scale-in">
        <p
          className="text-xs tracking-[0.35em] uppercase"
          style={{ color: '#c41e1eaa', fontFamily: 'var(--font-inter)' }}
        >
          {t.youAreThe}
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
          {t.impostor}
        </h2>
        <div
          className="w-32 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #c41e1e40, transparent)' }}
        />
        <p
          className="text-xs tracking-[0.2em] uppercase mt-1"
          style={{ color: '#c41e1e99', fontFamily: 'var(--font-inter)' }}
        >
          {t.pretend}
        </p>
        <div
          className={`fixed bottom-10 text-xs tracking-[0.25em] uppercase transition-opacity duration-500 ${
            canContinue ? 'opacity-40' : 'opacity-0'
          }`}
          style={{ color: '#c41e1e80', fontFamily: 'var(--font-inter)' }}
        >
          {t.tapToContinue}
        </div>
      </div>
    </>
  );
}

/* ── Finished screen ─────────────────────────────────────────── */
function FinishedScreen({ onRestart, t }: { onRestart: () => void; t: typeof T['pt'] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-8 animate-fade-up">
      <h2
        className="font-cinzel font-bold tracking-[0.3em] text-center"
        style={{ fontSize: '2rem', color: '#b8860b' }}
      >
        {t.allReady}
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
          {t.goodLuck}
        </p>
        <p
          className="text-sm tracking-wider"
          style={{ fontFamily: 'var(--font-inter)', color: '#3a3a3a' }}
        >
          {t.trustNoOne}
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
        {t.newGame}
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function GameClient() {
  const params = useSearchParams();
  const router = useRouter();

  const totalPlayers = parseInt(params.get('players') ?? '4');
  const totalImpostors = parseInt(params.get('impostors') ?? '1');
  const lang = (params.get('lang') ?? 'pt') as Lang;
  const t = T[lang] ?? T.pt;

  const [players, setPlayers] = useState<Player[]>([]);
  const [word, setWord] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [canContinue, setCanContinue] = useState(false);
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
      const wordFile = lang === 'en' ? '/words.txt' : '/palavras.txt';
      const res = await fetch(wordFile);
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

      const final = shuffle(shuffled).map((p, idx) => ({ ...p, id: idx + 1 }));
      setPlayers(final);
      setLoading(false);
    };
    init();
  }, [totalPlayers, totalImpostors, lang]);

  /* Enable "tap to continue" after 1.5 s when a role is revealed */
  useEffect(() => {
    if (phase !== 'revealed') return;
    setCanContinue(false);
    const t = setTimeout(() => setCanContinue(true), 1500);
    return () => clearTimeout(t);
  }, [phase, currentIndex]);

  const handleTap = useCallback(() => {
    if (loading) return;

    if (phase === 'idle') {
      setPhase('revealed');
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
  }, [loading, phase, players, currentIndex, canContinue]);

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
      {phase === 'idle' && (
        <IdleScreen playerNumber={players[currentIndex]?.id ?? currentIndex + 1} t={t} />
      )}

      {phase === 'revealed' && !players[currentIndex]?.isImpostor && (
        <InnocentScreen word={word} canContinue={canContinue} t={t} />
      )}

      {phase === 'revealed' && players[currentIndex]?.isImpostor && (
        <ImpostorScreen canContinue={canContinue} t={t} />
      )}

      {phase === 'finished' && (
        <FinishedScreen onRestart={() => router.push('/')} t={t} />
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
