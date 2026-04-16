'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

const PEER_PREFIX = 'impostor-';

type Phase = 'naming' | 'connecting' | 'waiting' | 'role' | 'voting' | 'results' | 'reveal' | 'error';
type Lang = 'pt' | 'en';

const T = {
  pt: {
    yourName: 'SEU NOME',
    nameHint: 'Como você quer ser chamado?',
    namePlaceholder: 'Digite seu nome',
    join: 'ENTRAR',
    connecting: (code: string) => `Conectando à sala ${code}...`,
    error: 'ERRO',
    back: 'VOLTAR',
    errNotFound: 'Sala não encontrada ou host desconectou.',
    errClosed: 'O host encerrou a sala.',
    errConnection: 'Erro na conexão com a sala.',
    errConnect: 'Não foi possível conectar. Verifique o código da sala.',
    votingTitle: 'VOTAÇÃO',
    whoIsImpostor: 'Quem é o impostor?',
    you: 'você',
    voteRegistered: 'Voto registrado',
    voted: (c: number, t: number) => `${c}/${t} votaram`,
    confirmVote: 'CONFIRMAR VOTO',
    resultsTitle: 'RESULTADO',
    eliminated: (name: string) => `${name} foi eliminado`,
    waitingReveal: 'Aguardando o host revelar...',
    wasImpostor: 'ERA O IMPOSTOR',
    townWon: 'A cidade venceu',
    wasInnocent: 'ERA INOCENTE',
    impostorLoose: 'O impostor continua solto...',
    room: 'SALA',
    waitingHost: 'Aguardando o host iniciar...',
    players: 'Jogadores',
    host: 'host',
    youKnowTheWord: 'Você conhece a palavra',
    youAreThe: 'Você é o',
    impostor: 'IMPOSTOR',
    pretend: 'Finja que sabe a palavra',
    voting: 'Votação',
    wantVote: (c: number, t: number) => `${c}/${t} querem votar`,
    requestVote: 'pedir votação',
    voteRequested: '✓ pedido',
    vote: 'voto',
    votes: 'votos',
  },
  en: {
    yourName: 'YOUR NAME',
    nameHint: 'What should we call you?',
    namePlaceholder: 'Enter your name',
    join: 'JOIN',
    connecting: (code: string) => `Connecting to room ${code}...`,
    error: 'ERROR',
    back: 'BACK',
    errNotFound: 'Room not found or host disconnected.',
    errClosed: 'The host closed the room.',
    errConnection: 'Connection error.',
    errConnect: 'Could not connect. Check the room code.',
    votingTitle: 'VOTING',
    whoIsImpostor: 'Who is the impostor?',
    you: 'you',
    voteRegistered: 'Vote registered',
    voted: (c: number, t: number) => `${c}/${t} voted`,
    confirmVote: 'CONFIRM VOTE',
    resultsTitle: 'RESULTS',
    eliminated: (name: string) => `${name} was eliminated`,
    waitingReveal: 'Waiting for host to reveal...',
    wasImpostor: 'WAS THE IMPOSTOR',
    townWon: 'The town won',
    wasInnocent: 'WAS INNOCENT',
    impostorLoose: 'The impostor is still out there...',
    room: 'ROOM',
    waitingHost: 'Waiting for host to start...',
    players: 'Players',
    host: 'host',
    youKnowTheWord: 'You know the word',
    youAreThe: 'You are the',
    impostor: 'IMPOSTOR',
    pretend: 'Pretend you know the word',
    voting: 'Voting',
    wantVote: (c: number, t: number) => `${c}/${t} want to vote`,
    requestVote: 'request voting',
    voteRequested: '✓ requested',
    vote: 'vote',
    votes: 'votes',
  },
};

interface LobbyPlayer { num: number; name: string; }
interface TallyEntry { num: number; count: number; name: string; }

/* ── Naming screen ───────────────────────────────────────────── */
function NamingScreen({ onConfirm, t }: { onConfirm: (name: string) => void; t: typeof T['pt'] }) {
  const [value, setValue] = useState('');
  const submit = () => { const n = value.trim(); if (n) onConfirm(n); };
  return (
    <div className="grain h-full flex flex-col items-center justify-center px-8 gap-10">
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-cinzel font-bold tracking-[0.3em] text-xl" style={{ color: '#b8860b' }}>
          {t.yourName}
        </h2>
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
          {t.nameHint}
        </p>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        maxLength={20}
        autoFocus
        placeholder={t.namePlaceholder}
        className="w-full max-w-xs text-center text-xl bg-transparent outline-none pb-2"
        style={{
          borderBottom: '1px solid #2a2a2a',
          color: '#f0ede6',
          fontFamily: 'var(--font-inter)',
          caretColor: '#c41e1e',
        }}
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="w-full max-w-xs py-4 font-cinzel font-bold tracking-[0.35em] text-sm transition-all active:scale-95"
        style={{
          background: value.trim() ? 'linear-gradient(135deg, #8b0000, #c41e1e)' : '#111111',
          color: value.trim() ? '#f0ede6' : '#2a2a2a',
          border: `1px solid ${value.trim() ? '#c41e1e40' : '#1a1a1a'}`,
        }}
      >
        {t.join}
      </button>
    </div>
  );
}

/* ── Voting screen ───────────────────────────────────────────── */
function VotingScreen({ players, myNum, selectedVote, confirmedVote, voteCount, total, onSelect, onConfirm, t }: {
  players: { num: number; name: string }[];
  myNum: number | null;
  selectedVote: number | null;
  confirmedVote: number | null;
  voteCount: number;
  total: number;
  onSelect: (n: number) => void;
  onConfirm: () => void;
  t: typeof T['pt'];
}) {
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-cinzel font-bold tracking-[0.4em] text-xl" style={{ color: '#b8860b' }}>{t.votingTitle}</h2>
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
          {t.whoIsImpostor}
        </p>
      </div>

      <div className="flex flex-col gap-0 flex-1">
        {players.map(p => {
          const isMe = p.num === myNum;
          const isSelected = selectedVote === p.num;
          const confirmed = confirmedVote !== null;
          const isConfirmed = confirmedVote === p.num;
          return (
            <button key={p.num} onClick={() => !confirmed && onSelect(p.num)} disabled={confirmed}
              className="flex items-center justify-between py-4 px-4 transition-all active:scale-[0.98]"
              style={{ borderBottom: '1px solid #1a1a1a', background: isSelected ? '#1a0000' : 'transparent' }}>
              <span className="text-sm" style={{ color: isSelected ? '#f0ede6' : '#555555', fontFamily: 'var(--font-inter)' }}>
                {p.name}
              </span>
              <div className="flex items-center gap-3">
                {isMe && <span className="text-xs tracking-widest uppercase" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>{t.you}</span>}
                {isConfirmed && <span style={{ color: '#c41e1e' }}>✓</span>}
                {isSelected && !confirmed && <div className="w-2 h-2 rounded-full" style={{ background: '#c41e1e' }} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {confirmedVote !== null ? (
          <div className="flex flex-col items-center gap-1 py-4">
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#c41e1e', fontFamily: 'var(--font-inter)' }}>
              {t.voteRegistered}
            </p>
            <p className="text-xs" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
              {t.voted(voteCount, total)}
            </p>
          </div>
        ) : (
          <button onClick={onConfirm} disabled={selectedVote === null}
            className="w-full py-4 font-cinzel font-bold tracking-[0.3em] text-sm transition-all active:scale-95"
            style={{
              background: selectedVote !== null ? 'linear-gradient(135deg, #8b0000, #c41e1e)' : '#111111',
              color: selectedVote !== null ? '#f0ede6' : '#2a2a2a',
              border: `1px solid ${selectedVote !== null ? '#c41e1e40' : '#1a1a1a'}`,
            }}>
            {t.confirmVote}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Results screen ──────────────────────────────────────────── */
function ResultsScreen({ tally, eliminatedNum, t }: { tally: TallyEntry[]; eliminatedNum: number; t: typeof T['pt'] }) {
  const maxCount = Math.max(...tally.map(t => t.count), 1);
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-cinzel font-bold tracking-[0.4em] text-xl" style={{ color: '#b8860b' }}>{t.resultsTitle}</h2>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {tally.map(entry => (
          <div key={entry.num} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] uppercase"
                style={{ color: entry.num === eliminatedNum ? '#f0ede6' : '#555555', fontFamily: 'var(--font-inter)' }}>
                {entry.name}{entry.num === eliminatedNum && ' ←'}
              </span>
              <span className="text-xs font-cinzel" style={{ color: entry.num === eliminatedNum ? '#c41e1e' : '#333333' }}>
                {entry.count} {entry.count === 1 ? t.vote : t.votes}
              </span>
            </div>
            <div className="h-px w-full" style={{ background: '#1a1a1a' }}>
              <div className="h-px transition-all duration-700"
                style={{ width: `${(entry.count / maxCount) * 100}%`, background: entry.num === eliminatedNum ? '#c41e1e' : '#2a2a2a' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 py-4" style={{ borderTop: '1px solid #1a1a1a' }}>
        <p className="text-xs" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>
          {t.eliminated(tally.find(e => e.num === eliminatedNum)?.name ?? `Jogador ${eliminatedNum}`)}
        </p>
        <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#2a2a2a', fontFamily: 'var(--font-inter)' }}>
          {t.waitingReveal}
        </p>
      </div>
    </div>
  );
}

/* ── Reveal screen ───────────────────────────────────────────── */
function RevealScreen({ eliminatedName, wasImpostor, t }: { eliminatedName: string; wasImpostor: boolean; t: typeof T['pt'] }) {
  return (
    <div className="grain h-full flex flex-col items-center justify-center px-8 gap-8 animate-scale-in relative">
      {wasImpostor ? (
        <>
          <p className="font-cinzel text-sm tracking-[0.3em] uppercase" style={{ color: '#c41e1e80' }}>{eliminatedName}</p>
          <h2 className="font-cinzel font-black text-center animate-blood-pulse"
            style={{ fontSize: 'clamp(2rem, 10vw, 4rem)', color: '#c41e1e', letterSpacing: '0.05em', lineHeight: 1.1 }}>
            {t.wasImpostor}
          </h2>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#c41e1e60', fontFamily: 'var(--font-inter)' }}>
            {t.townWon}
          </p>
        </>
      ) : (
        <>
          <p className="font-cinzel text-sm tracking-[0.3em] uppercase" style={{ color: '#444444' }}>{eliminatedName}</p>
          <h2 className="font-cinzel font-bold text-center"
            style={{ fontSize: 'clamp(2rem, 10vw, 4rem)', color: '#888888', letterSpacing: '0.05em', lineHeight: 1.1 }}>
            {t.wasInnocent}
          </h2>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
            {t.impostorLoose}
          </p>
        </>
      )}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function PlayerRoom() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = (searchParams.get('lang') ?? 'pt') as Lang;
  const t = T[lang] ?? T.pt;

  const [phase, setPhase] = useState<Phase>('naming');
  const [name, setName] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [myRole, setMyRole] = useState<{ role: 'innocent' | 'impostor'; word: string } | null>(null);
  const [myNum, setMyNum] = useState<number | null>(null);
  const [myNumSet, setMyNumSet] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Voting state
  const [hasRequestedVote, setHasRequestedVote] = useState(false);
  const [voteRequestCount, setVoteRequestCount] = useState(0);
  const [voteTotal, setVoteTotal] = useState(0);
  const [votingPlayers, setVotingPlayers] = useState<{ num: number; name: string }[]>([]);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [confirmedVote, setConfirmedVote] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [tally, setTally] = useState<TallyEntry[]>([]);
  const [eliminatedNum, setEliminatedNum] = useState<number | null>(null);
  const [revealData, setRevealData] = useState<{ eliminatedName: string; wasImpostor: boolean } | null>(null);

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const myNumRef = useRef<number | null>(null);
  const myNumSetRef = useRef(false);
  const nameRef = useRef('');

  useEffect(() => {
    if (phase !== 'connecting') return;
    let mounted = true;

    const init = async () => {
      const { default: Peer } = await import('peerjs');
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        if (!mounted) return;
        const hostId = `${PEER_PREFIX}${code.toLowerCase()}`;
        const conn = peer.connect(hostId, { reliable: true });
        connRef.current = conn;

        const timeout = setTimeout(() => {
          if (mounted) { setErrorMsg(t.errNotFound); setPhase('error'); }
        }, 8000);

        conn.on('open', () => {
          if (!mounted) return;
          clearTimeout(timeout);
          try { conn.send({ type: 'join', name: nameRef.current }); } catch {}
          setPhase('waiting');
        });

        conn.on('data', (msg: any) => {
          if (!mounted) return;

          if (msg.type === 'lobby') {
            const players: LobbyPlayer[] = msg.players;
            setLobbyPlayers(players);
            if (!myNumSetRef.current && players.length > 0) {
              const num = msg.myNum ?? Math.max(...players.map((p: LobbyPlayer) => p.num));
              myNumRef.current = num;
              myNumSetRef.current = true;
              setMyNum(num);
              setMyNumSet(true);
              setVoteTotal(players.length);
            }
          }

          if (msg.type === 'role') {
            setMyRole({ role: msg.role, word: msg.word ?? '' });
            setPhase('role');
          }

          if (msg.type === 'vote_status') {
            setVoteRequestCount(msg.count);
            setVoteTotal(msg.total);
          }

          if (msg.type === 'voting_open') {
            setVotingPlayers(msg.players);
            setVoteTotal(msg.players.length);
            setPhase('voting');
          }

          if (msg.type === 'vote_results') {
            setTally(msg.tally);
            setEliminatedNum(msg.eliminatedNum);
            setPhase('results');
          }

          if (msg.type === 'impostor_reveal') {
            setRevealData({ eliminatedName: msg.eliminatedName, wasImpostor: msg.wasImpostor });
            setPhase('reveal');
          }
        });

        conn.on('close', () => {
          if (mounted) {
            setErrorMsg(t.errClosed);
            setPhase('error');
          }
        });

        conn.on('error', () => {
          if (mounted) { setErrorMsg(t.errConnection); setPhase('error'); }
        });
      });

      peer.on('error', () => {
        if (mounted) { setErrorMsg(t.errConnect); setPhase('error'); }
      });
    };

    init();
    return () => { mounted = false; connRef.current?.close(); peerRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, phase]);

  const requestVote = () => {
    if (hasRequestedVote || !connRef.current) return;
    setHasRequestedVote(true);
    try { connRef.current.send({ type: 'request_vote' }); } catch {}
  };

  const confirmVote = () => {
    if (confirmedVote !== null || selectedVote === null || !connRef.current) return;
    setConfirmedVote(selectedVote);
    try { connRef.current.send({ type: 'vote', targetNum: selectedVote }); } catch {}
  };

  /* ── Naming ── */
  if (phase === 'naming') {
    return (
      <NamingScreen t={t} onConfirm={(n) => {
        setName(n);
        nameRef.current = n;
        setPhase('connecting');
      }} />
    );
  }

  /* ── Connecting ── */
  if (phase === 'connecting') {
    return (
      <div className="grain h-full flex flex-col items-center justify-center gap-4">
        <div className="w-1 h-8 animate-pulse" style={{ background: '#c41e1e' }} />
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
          {t.connecting(code.toUpperCase())}
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === 'error') {
    return (
      <div className="grain h-full flex flex-col items-center justify-center gap-6 px-8">
        <p className="font-cinzel text-lg tracking-widest" style={{ color: '#c41e1e' }}>{t.error}</p>
        <p className="text-sm text-center" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>{errorMsg}</p>
        <button onClick={() => router.push('/')}
          className="mt-4 px-8 py-4 font-cinzel text-xs tracking-[0.3em] active:scale-95 transition-all"
          style={{ border: '1px solid #1f1f1f', color: '#555555' }}>
          {t.back}
        </button>
      </div>
    );
  }

  /* ── Voting ── */
  if (phase === 'voting') {
    return (
      <VotingScreen
        players={votingPlayers}
        myNum={myNum}
        selectedVote={selectedVote}
        confirmedVote={confirmedVote}
        voteCount={voteCount}
        total={voteTotal}
        onSelect={setSelectedVote}
        onConfirm={confirmVote}
        t={t}
      />
    );
  }

  /* ── Results ── */
  if (phase === 'results' && eliminatedNum !== null) {
    return <ResultsScreen tally={tally} eliminatedNum={eliminatedNum} t={t} />;
  }

  /* ── Reveal ── */
  if (phase === 'reveal' && revealData) {
    return <RevealScreen eliminatedName={revealData.eliminatedName} wasImpostor={revealData.wasImpostor} t={t} />;
  }

  /* ── Role ── */
  if (phase === 'role' && myRole) {
    return (
      <div className="grain h-full flex items-center justify-center relative pb-20">
        {myRole.role === 'innocent' ? (
          <div className="flex flex-col items-center justify-center gap-8 px-8 animate-scale-in">
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>
              {t.youKnowTheWord}
            </p>
            <div className="w-20 h-px" style={{ background: 'linear-gradient(90deg, transparent, #1f1f1f, transparent)' }} />
            <p className="font-cinzel font-bold text-center leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 12vw, 5rem)', color: '#f0ede6', letterSpacing: '0.05em', wordBreak: 'break-word' }}>
              {myRole.word.toUpperCase()}
            </p>
          </div>
        ) : (
          <>
            <div className="relative flex flex-col items-center justify-center gap-6 px-8 animate-scale-in">
              <p className="text-xs tracking-[0.35em] uppercase" style={{ color: '#c41e1eaa', fontFamily: 'var(--font-inter)' }}>
                {t.youAreThe}
              </p>
              <h2 className="font-cinzel font-black animate-blood-pulse animate-flicker"
                style={{ fontSize: 'clamp(2.8rem, 13vw, 5.5rem)', color: '#c41e1e', letterSpacing: '0.06em', lineHeight: 1 }}>
                {t.impostor}
              </h2>
              <div className="w-32 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c41e1e40, transparent)' }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#c41e1e99', fontFamily: 'var(--font-inter)' }}>
                {t.pretend}
              </p>
            </div>
          </>
        )}
        {/* Vote request banner */}
        <div className="fixed bottom-0 left-0 right-0 px-6 py-5 flex items-center justify-between"
          style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a' }}>
          <div>
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
              {t.voting}
            </p>
            {voteRequestCount > 0 && (
              <p className="text-xs mt-0.5" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>
                {t.wantVote(voteRequestCount, voteTotal)}
              </p>
            )}
          </div>
          <button onClick={requestVote} disabled={hasRequestedVote}
            className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase font-cinzel transition-all active:scale-95"
            style={{
              background: hasRequestedVote ? 'transparent' : '#111111',
              color: hasRequestedVote ? '#c41e1e' : '#555555',
              border: `1px solid ${hasRequestedVote ? '#c41e1e30' : '#1f1f1f'}`,
            }}>
            {hasRequestedVote ? t.voteRequested : t.requestVote}
          </button>
        </div>
      </div>
    );
  }

  /* ── Waiting ── */
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-cinzel font-bold tracking-[0.3em] text-sm" style={{ color: '#b8860b' }}>{t.room}</h1>
        <span className="font-cinzel font-bold text-xl" style={{ color: '#f0ede6' }}>{code.toUpperCase()}</span>
      </div>

      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full animate-pulse"
              style={{ background: '#c41e1e', animationDelay: `${i * 300}ms` }} />
          ))}
        </div>
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>
          {t.waitingHost}
        </p>
      </div>

      <div className="flex flex-col gap-0">
        <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>
          {t.players} ({lobbyPlayers.length})
        </p>
        {lobbyPlayers.map(p => (
          <div key={p.num} className="flex items-center justify-between py-3 px-4"
            style={{ borderBottom: '1px solid #1a1a1a' }}>
            <span className="text-sm" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>
              {p.name}
            </span>
            <div className="flex gap-2">
              {p.num === myNum && myNumSet && (
                <span className="text-xs tracking-widest uppercase" style={{ color: '#b8860b', fontFamily: 'var(--font-inter)' }}>{t.you}</span>
              )}
              {p.num === 1 && (
                <span className="text-xs tracking-widest uppercase" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>{t.host}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
