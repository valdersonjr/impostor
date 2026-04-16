'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Lang = 'pt' | 'en';

const T = {
  pt: {
    tagline: 'Não confie em ninguém',
    players: 'Jogadores',
    impostors: 'Impostores',
    quickGame: 'JOGO RÁPIDO',
    createRoom: 'CRIAR SALA',
    summary: (p: number, i: number) =>
      `${p} jogadores · ${i} impostor${i > 1 ? 'es' : ''}`,
  },
  en: {
    tagline: 'Trust no one',
    players: 'Players',
    impostors: 'Impostors',
    quickGame: 'QUICK GAME',
    createRoom: 'CREATE ROOM',
    summary: (p: number, i: number) =>
      `${p} players · ${i} impostor${i > 1 ? 's' : ''}`,
  },
};

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="text-xs tracking-[0.3em] uppercase"
        style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-6">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-12 h-12 flex items-center justify-center border text-xl transition-all duration-150 active:scale-90"
          style={{
            borderColor: '#1f1f1f',
            color: value <= min ? '#333333' : '#888888',
            background: '#111111',
          }}
          disabled={value <= min}
        >
          −
        </button>
        <span
          className="font-cinzel text-5xl w-16 text-center tabular-nums"
          style={{ color: '#b8860b' }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-12 h-12 flex items-center justify-center border text-xl transition-all duration-150 active:scale-90"
          style={{
            borderColor: '#1f1f1f',
            color: value >= max ? '#333333' : '#888888',
            background: '#111111',
          }}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const router = useRouter();
  const [players, setPlayers] = useState(4);
  const [impostors, setImpostors] = useState(1);
  const [lang, setLang] = useState<Lang>('pt');

  const t = T[lang];

  const handlePlayersChange = (v: number) => {
    setPlayers(v);
    if (impostors >= v) setImpostors(v - 1);
  };

  const start = () => {
    router.push(`/game?players=${players}&impostors=${impostors}&lang=${lang}`);
  };

  return (
    <main className="grain relative flex flex-col items-center px-8 py-14 select-none overflow-y-auto" style={{ minHeight: '100%' }}>

      {/* Lang toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-1">
        {(['pt', 'en'] as Lang[]).map((l, i) => (
          <>
            {i > 0 && (
              <span key={`sep-${l}`} className="text-xs" style={{ color: '#2a2a2a' }}>·</span>
            )}
            <button
              key={l}
              onClick={() => setLang(l)}
              className="text-xs tracking-[0.2em] uppercase px-1 transition-all"
              style={{
                color: lang === l ? '#b8860b' : '#333333',
                fontFamily: 'var(--font-inter)',
              }}
            >
              {l.toUpperCase()}
            </button>
          </>
        ))}
      </div>

      {/* Logo + Title */}
      <div className="flex flex-col items-center gap-1 animate-fade-up" style={{ animationDelay: '0ms' }}>
        <div
          className="font-cinzel font-black leading-none animate-flicker"
          style={{ fontSize: '7rem', color: '#c41e1e', lineHeight: 1 }}
        >
          I
        </div>
        <div
          className="w-32 h-px mb-2"
          style={{ background: 'linear-gradient(90deg, transparent, #b8860b, transparent)' }}
        />
        <h1 className="font-cinzel font-bold tracking-[0.4em] text-2xl" style={{ color: '#b8860b' }}>
          IMPOSTOR
        </h1>
        <p className="mt-2 text-xs tracking-[0.2em] uppercase" style={{ color: '#444444' }}>
          {t.tagline}
        </p>
      </div>

      <div className="flex-1" style={{ minHeight: '2rem', maxHeight: '4rem' }} />

      {/* Steppers */}
      <div
        className="flex flex-col gap-10 w-full max-w-xs animate-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        <Stepper label={t.players} value={players} min={2} max={20} onChange={handlePlayersChange} />
        <div className="w-full h-px" style={{ background: '#1f1f1f' }} />
        <Stepper label={t.impostors} value={impostors} min={1} max={players - 1} onChange={(v) => setImpostors(v)} />
      </div>

      <div className="flex-1" style={{ minHeight: '2rem', maxHeight: '4rem' }} />

      {/* CTA */}
      <div
        className="w-full max-w-xs flex flex-col gap-3 animate-fade-up"
        style={{ animationDelay: '240ms' }}
      >
        <button
          onClick={start}
          className="w-full py-5 font-cinzel font-bold tracking-[0.35em] text-sm transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #8b0000, #c41e1e)',
            color: '#f0ede6',
            border: '1px solid #c41e1e40',
          }}
        >
          {t.quickGame}
        </button>
        <button
          onClick={() => router.push(`/criar?impostors=${impostors}&lang=${lang}`)}
          className="w-full py-4 font-cinzel font-bold tracking-[0.35em] text-sm transition-all duration-200 active:scale-95"
          style={{ background: 'transparent', color: '#555555', border: '1px solid #1f1f1f' }}
        >
          {t.createRoom}
        </button>
        <p className="text-center text-xs tracking-widest uppercase" style={{ color: '#2a2a2a' }}>
          {t.summary(players, impostors)}
        </p>
      </div>

    </main>
  );
}
