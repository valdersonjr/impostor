'use client';

import { useState, Fragment } from 'react';
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
    howToPlay: 'como jogar',
    aboutTitle: 'COMO JOGAR',
    aboutBody: [
      {
        heading: 'O que é',
        text: 'Alguém no grupo está mentindo. Todos receberam uma palavra secreta, todos exceto um. E esse alguém vai fazer de tudo para que você não descubra quem é.',
      },
      {
        heading: 'Como jogar',
        text: 'Inocentes conhecem a palavra. Falem sobre ela. Mas cuidado, revelar demais facilita a vida do impostor.\n\nO impostor não sabe nada. Observa. Escuta. Imita. E espera que ninguém perceba.\n\nCada jogador dá uma pista por rodada, uma palavra, uma frase, um indício. Quando o grupo decidir, a votação começa. O mais votado é eliminado. O host revela a verdade.',
      },
      {
        heading: 'Como vencer',
        text: 'Os inocentes vencem se o impostor for exposto. O impostor vence se sobreviver à suspeita.',
      },
    ],
    close: 'FECHAR',
  },
  en: {
    tagline: 'Trust no one',
    players: 'Players',
    impostors: 'Impostors',
    quickGame: 'QUICK GAME',
    createRoom: 'CREATE ROOM',
    summary: (p: number, i: number) =>
      `${p} players · ${i} impostor${i > 1 ? 's' : ''}`,
    howToPlay: 'how to play',
    aboutTitle: 'HOW TO PLAY',
    aboutBody: [
      {
        heading: 'What is it',
        text: 'Someone in the group is lying. Everyone received a secret word, everyone except one. And that someone will do everything to keep you from finding out who it is.',
      },
      {
        heading: 'How to play',
        text: 'Innocents know the word. Talk about it. But be careful, revealing too much makes the impostor\'s job easier.\n\nThe impostor knows nothing. Watches. Listens. Mimics. And hopes no one notices.\n\nEach player gives one clue per round, a word, a phrase, a hint. When the group decides, voting begins. The most voted is eliminated. The host reveals the truth.',
      },
      {
        heading: 'How to win',
        text: 'The innocents win if the impostor is exposed. The impostor wins if they survive suspicion.',
      },
    ],
    close: 'CLOSE',
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

function AboutModal({ t, onClose }: { t: typeof T['pt']; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#080808' }}
    >
      <div className="grain flex flex-col h-full px-8 py-12 overflow-y-auto">
        <div className="flex items-center justify-between mb-10">
          <h2
            className="font-cinzel font-bold tracking-[0.4em] text-sm"
            style={{ color: '#b8860b' }}
          >
            {t.aboutTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-xs tracking-[0.3em] uppercase transition-all active:scale-95"
            style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}
          >
            {t.close}
          </button>
        </div>

        <div className="flex flex-col gap-10">
          {t.aboutBody.map((section) => (
            <div key={section.heading} className="flex flex-col gap-3">
              <p
                className="text-xs tracking-[0.3em] uppercase"
                style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}
              >
                {section.heading}
              </p>
              <div
                className="w-full h-px"
                style={{ background: '#1a1a1a' }}
              />
              {section.text.split('\n\n').map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const router = useRouter();
  const [players, setPlayers] = useState(4);
  const [impostors, setImpostors] = useState(1);
  const [lang, setLang] = useState<Lang>('pt');
  const [showAbout, setShowAbout] = useState(false);

  const t = T[lang];

  const handlePlayersChange = (v: number) => {
    setPlayers(v);
    if (impostors >= v) setImpostors(v - 1);
  };

  const start = () => {
    router.push(`/game?players=${players}&impostors=${impostors}&lang=${lang}`);
  };

  return (
    <>
      {showAbout && <AboutModal t={t} onClose={() => setShowAbout(false)} />}

      <main className="grain relative flex flex-col items-center px-8 py-14 select-none overflow-y-auto" style={{ minHeight: '100%', background: '#080808' }}>

        {/* Núcleo vermelho no fundo */}
        <div
          className="animate-red-core-breathe pointer-events-none fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 38%, #2a000080 0%, transparent 70%)' }}
        />

        {/* Lang toggle */}
        <div className="absolute top-6 right-6 flex items-center gap-1">
          {(['pt', 'en'] as Lang[]).map((l, i) => (
            <Fragment key={l}>
              {i > 0 && (
                <span className="text-xs" style={{ color: '#2a2a2a' }}>·</span>
              )}
              <button
                onClick={() => setLang(l)}
                className="text-xs tracking-[0.2em] uppercase px-1 transition-all"
                style={{
                  color: lang === l ? '#b8860b' : '#333333',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {l.toUpperCase()}
              </button>
            </Fragment>
          ))}
        </div>

        {/* Vigneta que respira */}
        <div
          className="animate-vignette-breathe pointer-events-none fixed inset-0 z-10"
          style={{ boxShadow: 'inset 0 0 180px 80px rgba(0,0,0,0.97)' }}
        />

        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-1 animate-fade-up relative" style={{ animationDelay: '0ms' }}>

          {/* Observadores */}
          <div className="absolute animate-watcher-fade pointer-events-none" style={{ top: '-1.4rem', left: '50%', transform: 'translateX(-50%)', width: '5rem', height: '1rem' }}>
            <div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: '#c41e1e', top: 0, left: '24%', boxShadow: '0 0 4px #c41e1e' }} />
            <div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: '#c41e1e', top: '5px', left: '63%', boxShadow: '0 0 4px #c41e1e' }} />
          </div>

          <div className="relative">
            <div
              className="font-cinzel font-black leading-none animate-flicker animate-ambient-bleed"
              style={{ fontSize: '7rem', color: '#c41e1e', lineHeight: 1 }}
            >
              I
            </div>
            {/* Drip de sangue */}
            <div
              className="animate-blood-drip absolute left-1/2 top-full pointer-events-none"
              style={{ width: '1px', background: 'linear-gradient(to bottom, #c41e1e, transparent)', transform: 'translateX(-50%)' }}
            />
          </div>

          <div
            className="w-32 h-px mb-2"
            style={{ background: 'linear-gradient(90deg, transparent, #b8860b, transparent)' }}
          />
          <h1
            className="font-cinzel font-bold text-2xl animate-letter-breathe animate-text-glitch"
            style={{ color: '#b8860b', letterSpacing: '0.4em' }}
          >
            IMPOSTOR
          </h1>
          <p className="mt-2 text-xs tracking-[0.2em] uppercase" style={{ color: '#333333' }}>
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

        {/* How to play */}
        <button
          onClick={() => setShowAbout(true)}
          className="mt-8 text-xs tracking-[0.25em] uppercase transition-all active:scale-95"
          style={{ color: '#2a2a2a', fontFamily: 'var(--font-inter)' }}
        >
          {t.howToPlay}
        </button>

      </main>
    </>
  );
}
