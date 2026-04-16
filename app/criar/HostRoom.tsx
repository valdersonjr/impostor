'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

/* ── Utilities ───────────────────────────────────────────────── */
const PEER_PREFIX = 'impostor-';

type Lang = 'pt' | 'en';

const T = {
  pt: {
    yourName: 'SEU NOME',
    nameHint: 'Como você quer ser chamado?',
    namePlaceholder: 'Digite seu nome',
    createRoom: 'CRIAR SALA',
    impostors: 'Impostores',
    room: 'SALA',
    copyLink: 'copiar link',
    linkCopied: 'link copiado ✓',
    players: 'Jogadores',
    waitingPlayers: 'Aguardando jogadores...',
    you: 'você',
    host: 'host',
    startGame: 'INICIAR JOGO',
    youKnowTheWord: 'Você conhece a palavra',
    youAreThe: 'Você é o',
    impostor: 'IMPOSTOR',
    pretend: 'Finja que sabe a palavra',
    voting: 'Votação',
    wantVote: (c: number, t: number) => `${c}/${t} querem votar`,
    requestVote: 'pedir votação',
    voteRequested: '✓ pedido',
    votingTitle: 'VOTAÇÃO',
    whoIsImpostor: 'Quem é o impostor?',
    confirmVote: 'CONFIRMAR VOTO',
    voteRegistered: 'Voto registrado',
    voted: (c: number, t: number) => `${c}/${t} votaram`,
    resultsTitle: 'RESULTADO',
    eliminated: (name: string) => `${name} foi eliminado`,
    revealImpostor: 'REVELAR IMPOSTOR',
    waitingReveal: 'Aguardando o host revelar...',
    wasImpostor: 'ERA O IMPOSTOR',
    townWon: 'A cidade venceu',
    wasInnocent: 'ERA INOCENTE',
    impostorLoose: 'O impostor continua solto...',
    newGame: 'NOVO JOGO',
    vote: 'voto',
    votes: 'votos',
  },
  en: {
    yourName: 'YOUR NAME',
    nameHint: 'What should we call you?',
    namePlaceholder: 'Enter your name',
    createRoom: 'CREATE ROOM',
    impostors: 'Impostors',
    room: 'ROOM',
    copyLink: 'copy link',
    linkCopied: 'link copied ✓',
    players: 'Players',
    waitingPlayers: 'Waiting for players...',
    you: 'you',
    host: 'host',
    startGame: 'START GAME',
    youKnowTheWord: 'You know the word',
    youAreThe: 'You are the',
    impostor: 'IMPOSTOR',
    pretend: 'Pretend you know the word',
    voting: 'Voting',
    wantVote: (c: number, t: number) => `${c}/${t} want to vote`,
    requestVote: 'request voting',
    voteRequested: '✓ requested',
    votingTitle: 'VOTING',
    whoIsImpostor: 'Who is the impostor?',
    confirmVote: 'CONFIRM VOTE',
    voteRegistered: 'Vote registered',
    voted: (c: number, t: number) => `${c}/${t} voted`,
    resultsTitle: 'RESULTS',
    eliminated: (name: string) => `${name} was eliminated`,
    revealImpostor: 'REVEAL IMPOSTOR',
    waitingReveal: 'Waiting for host to reveal...',
    wasImpostor: 'WAS THE IMPOSTOR',
    townWon: 'The town won',
    wasInnocent: 'WAS INNOCENT',
    impostorLoose: 'The impostor is still out there...',
    newGame: 'NEW GAME',
    vote: 'vote',
    votes: 'votes',
  },
};

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Types ───────────────────────────────────────────────────── */
type Phase = 'naming' | 'loading' | 'lobby' | 'role' | 'voting' | 'results' | 'reveal';

interface ConnectedPlayer { peerId: string; num: number; conn: any; name: string; }
interface TallyEntry { num: number; count: number; isImpostor: boolean; name: string; }

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
        {t.createRoom}
      </button>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */
function Stepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center border text-lg transition-all active:scale-90"
          style={{ borderColor: '#1f1f1f', color: value <= min ? '#2a2a2a' : '#888888', background: '#111111' }}>−</button>
        <span className="font-cinzel text-2xl w-8 text-center" style={{ color: '#b8860b' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center border text-lg transition-all active:scale-90"
          style={{ borderColor: '#1f1f1f', color: value >= max ? '#2a2a2a' : '#888888', background: '#111111' }}>+</button>
      </div>
    </div>
  );
}

function VoteRequestBanner({ requested, count, total, onRequest, t }: {
  requested: boolean; count: number; total: number; onRequest: () => void; t: typeof T['pt'];
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 flex items-center justify-between"
      style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a', paddingTop: '1.25rem', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
      <div>
        <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
          {t.voting}
        </p>
        {count > 0 && (
          <p className="text-xs mt-0.5" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>
            {t.wantVote(count, total)}
          </p>
        )}
      </div>
      <button onClick={onRequest} disabled={requested}
        className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase font-cinzel transition-all active:scale-95"
        style={{
          background: requested ? 'transparent' : '#111111',
          color: requested ? '#c41e1e' : '#555555',
          border: `1px solid ${requested ? '#c41e1e30' : '#1f1f1f'}`,
        }}>
        {requested ? t.voteRequested : t.requestVote}
      </button>
    </div>
  );
}

function VotingScreen({ players, myNum, selectedVote, confirmedVote, voteCount, total, onSelect, onConfirm, t }: {
  players: { num: number; name: string }[];
  myNum: number;
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
        <h2 className="font-cinzel font-bold tracking-[0.4em] text-xl" style={{ color: '#b8860b' }}>
          {t.votingTitle}
        </h2>
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
            <button key={p.num} onClick={() => !confirmed && onSelect(p.num)}
              disabled={confirmed}
              className="flex items-center justify-between py-4 px-4 transition-all active:scale-[0.98]"
              style={{
                borderBottom: '1px solid #1a1a1a',
                background: isSelected ? '#1a0000' : 'transparent',
              }}>
              <span className="text-sm" style={{ color: isSelected ? '#f0ede6' : '#555555', fontFamily: 'var(--font-inter)' }}>
                {p.name}
              </span>
              <div className="flex items-center gap-3">
                {isMe && (
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>{t.you}</span>
                )}
                {isConfirmed && (
                  <span style={{ color: '#c41e1e' }}>✓</span>
                )}
                {isSelected && !confirmed && (
                  <div className="w-2 h-2 rounded-full" style={{ background: '#c41e1e' }} />
                )}
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

function ResultsScreen({ tally, eliminatedNum, isHost, onReveal, t }: {
  tally: TallyEntry[];
  eliminatedNum: number;
  isHost: boolean;
  onReveal?: () => void;
  t: typeof T['pt'];
}) {
  const maxCount = Math.max(...tally.map(t => t.count), 1);
  const eliminatedName = tally.find(t => t.num === eliminatedNum)?.name ?? `Jogador ${eliminatedNum}`;
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-cinzel font-bold tracking-[0.4em] text-xl" style={{ color: '#b8860b' }}>
          {t.resultsTitle}
        </h2>
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
                style={{
                  width: `${(entry.count / maxCount) * 100}%`,
                  background: entry.num === eliminatedNum ? '#c41e1e' : '#2a2a2a',
                }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 py-4" style={{ borderTop: '1px solid #1a1a1a' }}>
        <p className="text-xs text-center" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>
          {t.eliminated(eliminatedName)}
        </p>
        {isHost && onReveal && (
          <button onClick={onReveal}
            className="w-full py-4 font-cinzel font-bold tracking-[0.3em] text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8b0000, #c41e1e)', color: '#f0ede6', border: '1px solid #c41e1e40' }}>
            {t.revealImpostor}
          </button>
        )}
        {!isHost && (
          <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#2a2a2a', fontFamily: 'var(--font-inter)' }}>
            {t.waitingReveal}
          </p>
        )}
      </div>
    </div>
  );
}

function RevealScreen({ eliminatedName, wasImpostor, onNewGame, t }: {
  eliminatedName: string; wasImpostor: boolean; onNewGame: () => void; t: typeof T['pt'];
}) {
  return (
    <div className="grain h-full flex flex-col items-center justify-center px-8 gap-6 relative overflow-hidden">
      {wasImpostor && (
        <div className="animate-reveal-flood fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, #3a000080 0%, transparent 70%)' }} />
      )}
      {wasImpostor ? (
        <>
          <p className="font-cinzel text-xs tracking-[0.4em] uppercase animate-stagger-in"
            style={{ color: '#c41e1e50', animationDelay: '0ms' }}>
            {eliminatedName}
          </p>
          <div className="w-16 h-px animate-stagger-in"
            style={{ background: '#c41e1e30', animationDelay: '400ms' }} />
          <h2 className="font-cinzel font-black text-center animate-blood-pulse animate-stagger-in"
            style={{ fontSize: 'clamp(2.2rem, 11vw, 4.5rem)', color: '#c41e1e', letterSpacing: '0.04em', lineHeight: 1, animationDelay: '700ms' }}>
            {t.wasImpostor}
          </h2>
          <p className="text-xs tracking-[0.3em] uppercase animate-stagger-in"
            style={{ color: '#c41e1e40', fontFamily: 'var(--font-inter)', animationDelay: '1300ms' }}>
            {t.townWon}
          </p>
        </>
      ) : (
        <>
          <p className="font-cinzel text-xs tracking-[0.4em] uppercase animate-stagger-in"
            style={{ color: '#2a2a2a', animationDelay: '0ms' }}>
            {eliminatedName}
          </p>
          <div className="w-16 h-px animate-stagger-in"
            style={{ background: '#1f1f1f', animationDelay: '400ms' }} />
          <h2 className="font-cinzel font-bold text-center animate-stagger-in"
            style={{ fontSize: 'clamp(2.2rem, 11vw, 4.5rem)', color: '#444444', letterSpacing: '0.04em', lineHeight: 1, animationDelay: '700ms' }}>
            {t.wasInnocent}
          </h2>
          <p className="text-xs tracking-[0.3em] uppercase animate-stagger-in"
            style={{ color: '#222222', fontFamily: 'var(--font-inter)', animationDelay: '1300ms' }}>
            {t.impostorLoose}
          </p>
        </>
      )}
      <button onClick={onNewGame}
        className="absolute bottom-10 px-8 py-4 font-cinzel text-xs tracking-[0.3em] transition-all active:scale-95 animate-stagger-in"
        style={{ border: '1px solid #1a1a1a', color: '#333333', animationDelay: '2000ms' }}>
        {t.newGame}
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function HostRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = (searchParams.get('lang') ?? 'pt') as Lang;
  const t = T[lang] ?? T.pt;

  const [phase, setPhase] = useState<Phase>('naming');
  const [phaseFlash, setPhaseFlash] = useState(false);

  useEffect(() => {
    if (['role', 'voting', 'results', 'reveal'].includes(phase)) {
      setPhaseFlash(true);
      const t = setTimeout(() => setPhaseFlash(false), 550);
      return () => clearTimeout(t);
    }
  }, [phase]);
  const [hostName, setHostName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomUrl, setRoomUrl] = useState('');
  const [players, setPlayers] = useState<ConnectedPlayer[]>([]);
  const [impostors, setImpostors] = useState(parseInt(searchParams.get('impostors') ?? '1'));
  const [myRole, setMyRole] = useState<{ role: 'innocent' | 'impostor'; word: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [peerInit, setPeerInit] = useState(false);

  // Voting state
  const [hasRequestedVote, setHasRequestedVote] = useState(false);
  const [voteRequestCount, setVoteRequestCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [allPlayers, setAllPlayers] = useState<{ num: number; name: string }[]>([]);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [confirmedVote, setConfirmedVote] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [tally, setTally] = useState<TallyEntry[]>([]);
  const [eliminatedNum, setEliminatedNum] = useState<number | null>(null);
  const [eliminatedName, setEliminatedName] = useState<string | null>(null);

  // Refs (safe to read inside PeerJS callbacks)
  const peerRef = useRef<any>(null);
  const playersRef = useRef<ConnectedPlayer[]>([]);
  const counterRef = useRef(2);
  const wordRef = useRef('');
  const hostNameRef = useRef('');
  const impostorNumsRef = useRef<Set<number>>(new Set());
  const hasRequestedVoteRef = useRef(false);
  const voteRequestsRef = useRef<Set<string>>(new Set());
  const votesRef = useRef<Map<string, number>>(new Map());
  const confirmedVoteRef = useRef<number | null>(null);
  const totalPlayersRef = useRef(0);
  const allPlayersRef = useRef<{ num: number; name: string }[]>([]);

  /* ── Stable helpers (only use refs internally) ─────────────── */
  const broadcastAll = useCallback((msg: any) => {
    playersRef.current.forEach(p => { try { p.conn.send(msg); } catch {} });
  }, []);

  const broadcastLobby = useCallback((current: ConnectedPlayer[]) => {
    const list = [
      { num: 1, name: hostNameRef.current },
      ...current.map(p => ({ num: p.num, name: p.name })),
    ];
    current.forEach(p => { try { p.conn.send({ type: 'lobby', players: list, myNum: p.num }); } catch {} });
  }, []);

  const finalizeVotes = useCallback(() => {
    const players = allPlayersRef.current;
    const tallyMap = new Map<number, number>(players.map(p => [p.num, 0]));

    votesRef.current.forEach(targetNum => {
      tallyMap.set(targetNum, (tallyMap.get(targetNum) ?? 0) + 1);
    });
    if (confirmedVoteRef.current !== null) {
      const tv = confirmedVoteRef.current;
      tallyMap.set(tv, (tallyMap.get(tv) ?? 0) + 1);
    }

    const sorted: TallyEntry[] = Array.from(tallyMap.entries())
      .map(([num, count]) => {
        const player = players.find(p => p.num === num);
        return { num, count, isImpostor: impostorNumsRef.current.has(num), name: player?.name ?? `Jogador ${num}` };
      })
      .sort((a, b) => b.count - a.count || a.num - b.num);

    const eliminated = sorted[0].num;
    const elName = sorted[0].name;
    setTally(sorted);
    setEliminatedNum(eliminated);
    setEliminatedName(elName);
    setPhase('results');
    broadcastAll({
      type: 'vote_results',
      tally: sorted.map(({ num, count, name }) => ({ num, count, name })),
      eliminatedNum: eliminated,
    });
  }, [broadcastAll]);

  const triggerVoting = useCallback(() => {
    setPhase('voting');
    broadcastAll({ type: 'voting_open', players: allPlayersRef.current });
  }, [broadcastAll]);

  /* ── PeerJS init ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!peerInit) return;
    let mounted = true;

    const init = async (retryCode?: string) => {
      const { default: Peer } = await import('peerjs');
      const code = retryCode ?? genCode();
      if (!mounted) return;

      setRoomCode(code);
      const langParam = lang !== 'pt' ? `?lang=${lang}` : '';
      setRoomUrl(`${window.location.origin}/sala/${code}${langParam}`);

      const peer = new Peer(`${PEER_PREFIX}${code.toLowerCase()}`);
      peerRef.current = peer;

      peer.on('open', () => { if (mounted) setPhase('lobby'); });
      peer.on('error', (err: any) => {
        if (err.type === 'unavailable-id') { peer.destroy(); if (mounted) init(genCode()); }
      });

      peer.on('connection', (conn: any) => {
        conn.on('open', () => {
          if (!mounted) return;
          if (playersRef.current.length >= 19) { conn.close(); return; }
          const num = counterRef.current++;
          const player: ConnectedPlayer = { peerId: conn.peer, num, conn, name: '' };
          playersRef.current = [...playersRef.current, player];
          setPlayers([...playersRef.current]);
          broadcastLobby(playersRef.current);
        });

        conn.on('data', (msg: any) => {
          if (msg.type === 'join') {
            if (typeof msg.name !== 'string') return;
            const safeName = msg.name.trim().slice(0, 20) || '?';
            const updated = playersRef.current.map(p =>
              p.peerId === conn.peer ? { ...p, name: safeName } : p
            );
            playersRef.current = updated;
            setPlayers([...updated]);
            broadcastLobby(updated);
          }

          if (msg.type === 'request_vote') {
            voteRequestsRef.current.add(conn.peer);
            const hostVal = hasRequestedVoteRef.current ? 1 : 0;
            const count = voteRequestsRef.current.size + hostVal;
            const total = totalPlayersRef.current;
            setVoteRequestCount(count);
            broadcastAll({ type: 'vote_status', count, total });
            if (total > 0 && count >= total) triggerVoting();
          }

          if (msg.type === 'vote') {
            const isValidTarget = typeof msg.targetNum === 'number' &&
              allPlayersRef.current.some(p => p.num === msg.targetNum);
            if (!isValidTarget) return;
            votesRef.current.set(conn.peer, msg.targetNum);
            const total = totalPlayersRef.current;
            const count = votesRef.current.size + (confirmedVoteRef.current !== null ? 1 : 0);
            setVoteCount(count);
            if (total > 0 && count >= total) finalizeVotes();
          }
        });

        conn.on('close', () => {
          playersRef.current = playersRef.current.filter(p => p.peerId !== conn.peer);
          setPlayers([...playersRef.current]);
          if (mounted) broadcastLobby(playersRef.current);
        });

        conn.on('error', () => {
          playersRef.current = playersRef.current.filter(p => p.peerId !== conn.peer);
          setPlayers([...playersRef.current]);
        });
      });
    };

    const wordFile = lang === 'en' ? '/words.txt' : '/palavras.txt';
    fetch(wordFile)
      .then(r => r.text())
      .then(text => {
        const words = text.split('\n').map(w => w.trim()).filter(Boolean);
        wordRef.current = words[Math.floor(Math.random() * words.length)];
      });

    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {});
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    init();
    return () => {
      mounted = false;
      peerRef.current?.destroy();
      wakeLock?.release();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [peerInit, broadcastAll, broadcastLobby, triggerVoting, finalizeVotes, lang]);

  /* ── Game actions ────────────────────────────────────────────── */
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const startGame = useCallback(() => {
    vibrate([40, 30, 120]);
    const allSlots = [
      { id: 'host', num: 1, name: hostNameRef.current },
      ...playersRef.current.map(p => ({ id: p.peerId, num: p.num, name: p.name })),
    ];
    const shuffled = shuffle(allSlots);
    const cap = Math.min(impostors, allSlots.length - 1);
    const roleMap = new Map(shuffled.map((s, i) => [s.id, i < cap ? 'impostor' : 'innocent']));

    const playersList = allSlots.map(({ num, name }) => ({ num, name }));
    allPlayersRef.current = playersList;
    totalPlayersRef.current = playersList.length;
    setAllPlayers(playersList);
    setTotalPlayers(playersList.length);

    const impostorNums = new Set<number>();
    shuffled.slice(0, cap).forEach(s => impostorNums.add(s.num));
    impostorNumsRef.current = impostorNums;

    playersRef.current.forEach(p => {
      const role = roleMap.get(p.peerId) as 'innocent' | 'impostor';
      try { p.conn.send({ type: 'role', role, word: role === 'innocent' ? wordRef.current : '' }); } catch {}
    });

    const hostRole = roleMap.get('host') as 'innocent' | 'impostor';
    setMyRole({ role: hostRole, word: hostRole === 'innocent' ? wordRef.current : '' });
    setPhase('role');
  }, [impostors]);

  const requestVote = useCallback(() => {
    if (hasRequestedVoteRef.current) return;
    hasRequestedVoteRef.current = true;
    setHasRequestedVote(true);
    const count = voteRequestsRef.current.size + 1;
    const total = totalPlayersRef.current;
    setVoteRequestCount(count);
    broadcastAll({ type: 'vote_status', count, total });
    if (total > 0 && count >= total) triggerVoting();
  }, [broadcastAll, triggerVoting]);

  const confirmVote = useCallback(() => {
    if (confirmedVoteRef.current !== null || selectedVote === null) return;
    confirmedVoteRef.current = selectedVote;
    setConfirmedVote(selectedVote);
    const total = totalPlayersRef.current;
    const count = votesRef.current.size + 1;
    setVoteCount(count);
    if (total > 0 && count >= total) finalizeVotes();
  }, [selectedVote, finalizeVotes]);

  const revealImpostor = useCallback(() => {
    if (eliminatedNum === null) return;
    const wasImpostor = impostorNumsRef.current.has(eliminatedNum);
    const player = allPlayersRef.current.find(p => p.num === eliminatedNum);
    const elName = player?.name ?? `Jogador ${eliminatedNum}`;
    setEliminatedName(elName);
    broadcastAll({ type: 'impostor_reveal', eliminatedName: elName, wasImpostor });
    setPhase('reveal');
  }, [eliminatedNum, broadcastAll]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomUrl]);

  const totalInLobby = 1 + players.length;

  const flashOverlay = phaseFlash ? (
    <div className="animate-phase-flash fixed inset-0 z-50 pointer-events-none" style={{ background: '#000' }} />
  ) : null;

  /* ── Render: Naming ── */
  if (phase === 'naming') {
    return (
      <NamingScreen t={t} onConfirm={(name) => {
        setHostName(name);
        hostNameRef.current = name;
        setPeerInit(true);
        setPhase('loading');
      }} />
    );
  }

  /* ── Render: Loading ── */
  if (phase === 'loading') {
    return (
      <div className="grain h-full flex items-center justify-center">
        <div className="w-1 h-8 animate-pulse" style={{ background: '#c41e1e' }} />
      </div>
    );
  }

  /* ── Render: Voting ── */
  if (phase === 'voting') {
    return (
      <>
        {flashOverlay}
        <VotingScreen
          players={allPlayers}
          myNum={1}
          selectedVote={selectedVote}
          confirmedVote={confirmedVote}
          voteCount={voteCount}
          total={totalPlayers}
          onSelect={setSelectedVote}
          onConfirm={confirmVote}
          t={t}
        />
      </>
    );
  }

  /* ── Render: Results ── */
  if (phase === 'results' && eliminatedNum !== null) {
    return (
      <>
        {flashOverlay}
        <ResultsScreen
          tally={tally}
          eliminatedNum={eliminatedNum}
          isHost={true}
          onReveal={revealImpostor}
          t={t}
        />
      </>
    );
  }

  /* ── Render: Reveal ── */
  if (phase === 'reveal' && eliminatedName !== null) {
    const wasImpostor = eliminatedNum !== null && impostorNumsRef.current.has(eliminatedNum);
    return (
      <>
        {flashOverlay}
        <RevealScreen
          eliminatedName={eliminatedName}
          wasImpostor={wasImpostor}
          onNewGame={() => router.push('/')}
          t={t}
        />
      </>
    );
  }

  /* ── Render: Role ── */
  if (phase === 'role' && myRole) {
    return (
      <>
      {flashOverlay}
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
        <VoteRequestBanner
          requested={hasRequestedVote}
          count={voteRequestCount}
          total={totalPlayers}
          onRequest={requestVote}
          t={t}
        />
      </div>
      </>
    );
  }

  /* ── Render: Lobby ── */
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/')} style={{ color: '#333333' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-cinzel font-bold tracking-[0.3em] text-sm" style={{ color: '#b8860b' }}>{t.room}</h1>
        <span className="font-cinzel font-bold text-xl" style={{ color: '#f0ede6' }}>{roomCode}</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="p-3" style={{ border: '1px solid #1f1f1f' }}>
          <QRCodeSVG value={roomUrl} size={180} bgColor="#080808" fgColor="#c8c4bc" />
        </div>
        <button onClick={copyLink}
          className="text-xs tracking-[0.25em] uppercase transition-all active:scale-95"
          style={{ color: copied ? '#b8860b' : '#444444', fontFamily: 'var(--font-inter)' }}>
          {copied ? t.linkCopied : t.copyLink}
        </button>
      </div>

      <div className="flex flex-col gap-0">
        <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>
          {t.players} ({totalInLobby})
        </p>
        <div className="flex items-center justify-between py-3 px-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <span className="text-sm" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>{hostName}</span>
          <div className="flex gap-2">
            <span className="text-xs tracking-widest uppercase" style={{ color: '#b8860b', fontFamily: 'var(--font-inter)' }}>{t.you}</span>
            <span className="text-xs tracking-widest uppercase" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>{t.host}</span>
          </div>
        </div>
        {players.map(p => (
          <div key={p.peerId} className="flex items-center justify-between py-3 px-4 animate-fade-in" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <span className="text-sm" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>
              {p.name || '...'}
            </span>
          </div>
        ))}
        {totalInLobby < 2 && (
          <p className="text-xs text-center mt-3" style={{ color: '#2a2a2a', fontFamily: 'var(--font-inter)' }}>
            {t.waitingPlayers}
          </p>
        )}
      </div>

      <div className="py-4 px-4" style={{ border: '1px solid #1a1a1a' }}>
        <Stepper label={t.impostors} value={impostors} min={1} max={Math.max(1, totalInLobby - 1)} onChange={setImpostors} />
      </div>

      <button onClick={startGame} disabled={totalInLobby < 2}
        className="w-full py-5 font-cinzel font-bold tracking-[0.35em] text-sm transition-all active:scale-95"
        style={{
          background: totalInLobby >= 2 ? 'linear-gradient(135deg, #8b0000, #c41e1e)' : '#111111',
          color: totalInLobby >= 2 ? '#f0ede6' : '#2a2a2a',
          border: `1px solid ${totalInLobby >= 2 ? '#c41e1e40' : '#1a1a1a'}`,
        }}>
        {t.startGame}
      </button>
    </div>
  );
}
