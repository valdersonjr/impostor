'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

/* ── Utilities ───────────────────────────────────────────────── */
const PEER_PREFIX = 'impostor-';

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
type Phase = 'loading' | 'lobby' | 'role' | 'voting' | 'results' | 'reveal';

interface ConnectedPlayer { peerId: string; num: number; conn: any; }
interface TallyEntry { num: number; count: number; isImpostor: boolean; }

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

function VoteRequestBanner({ requested, count, total, onRequest }: {
  requested: boolean; count: number; total: number; onRequest: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 py-5 flex items-center justify-between"
      style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a' }}>
      <div>
        <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
          Votação
        </p>
        {count > 0 && (
          <p className="text-xs mt-0.5" style={{ color: '#555555', fontFamily: 'var(--font-inter)' }}>
            {count}/{total} querem votar
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
        {requested ? '✓ pedido' : 'pedir votação'}
      </button>
    </div>
  );
}

function VotingScreen({ players, myNum, selectedVote, confirmedVote, voteCount, total, onSelect, onConfirm }: {
  players: { num: number }[];
  myNum: number;
  selectedVote: number | null;
  confirmedVote: number | null;
  voteCount: number;
  total: number;
  onSelect: (n: number) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-cinzel font-bold tracking-[0.4em] text-xl" style={{ color: '#b8860b' }}>
          VOTAÇÃO
        </h2>
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
          Quem é o impostor?
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
                Jogador {p.num}
              </span>
              <div className="flex items-center gap-3">
                {isMe && (
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>você</span>
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
              Voto registrado
            </p>
            <p className="text-xs" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
              {voteCount}/{total} votaram
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
            CONFIRMAR VOTO
          </button>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ tally, eliminatedNum, isHost, onReveal }: {
  tally: TallyEntry[];
  eliminatedNum: number;
  isHost: boolean;
  onReveal?: () => void;
}) {
  const maxCount = Math.max(...tally.map(t => t.count), 1);
  return (
    <div className="grain h-full flex flex-col px-6 py-10 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="font-cinzel font-bold tracking-[0.4em] text-xl" style={{ color: '#b8860b' }}>
          RESULTADO
        </h2>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {tally.map(entry => (
          <div key={entry.num} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] uppercase"
                style={{ color: entry.num === eliminatedNum ? '#f0ede6' : '#555555', fontFamily: 'var(--font-inter)' }}>
                Jogador {entry.num}
                {entry.num === eliminatedNum && ' ←'}
              </span>
              <span className="text-xs font-cinzel" style={{ color: entry.num === eliminatedNum ? '#c41e1e' : '#333333' }}>
                {entry.count} {entry.count === 1 ? 'voto' : 'votos'}
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
          Jogador {eliminatedNum} foi eliminado
        </p>
        {isHost && onReveal && (
          <button onClick={onReveal}
            className="w-full py-4 font-cinzel font-bold tracking-[0.3em] text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8b0000, #c41e1e)', color: '#f0ede6', border: '1px solid #c41e1e40' }}>
            REVELAR IMPOSTOR
          </button>
        )}
        {!isHost && (
          <p className="text-xs tracking-[0.25em] uppercase" style={{ color: '#2a2a2a', fontFamily: 'var(--font-inter)' }}>
            Aguardando o host revelar...
          </p>
        )}
      </div>
    </div>
  );
}

function RevealScreen({ eliminatedNum, wasImpostor, onNewGame }: {
  eliminatedNum: number; wasImpostor: boolean; onNewGame: () => void;
}) {
  return (
    <div className="grain h-full flex flex-col items-center justify-center px-8 gap-8 relative animate-scale-in">
      {wasImpostor ? (
        <>
          <div className="fixed inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 160px 60px rgba(139,0,0,0.4)' }} />
          <p className="font-cinzel text-sm tracking-[0.3em] uppercase" style={{ color: '#c41e1e80' }}>
            Jogador {eliminatedNum}
          </p>
          <h2 className="font-cinzel font-black text-center animate-blood-pulse"
            style={{ fontSize: 'clamp(2rem, 10vw, 4rem)', color: '#c41e1e', letterSpacing: '0.05em', lineHeight: 1.1 }}>
            ERA O IMPOSTOR
          </h2>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#c41e1e60', fontFamily: 'var(--font-inter)' }}>
            A cidade venceu
          </p>
        </>
      ) : (
        <>
          <p className="font-cinzel text-sm tracking-[0.3em] uppercase" style={{ color: '#444444' }}>
            Jogador {eliminatedNum}
          </p>
          <h2 className="font-cinzel font-bold text-center"
            style={{ fontSize: 'clamp(2rem, 10vw, 4rem)', color: '#888888', letterSpacing: '0.05em', lineHeight: 1.1 }}>
            ERA INOCENTE
          </h2>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#333333', fontFamily: 'var(--font-inter)' }}>
            O impostor continua solto...
          </p>
        </>
      )}
      <button onClick={onNewGame}
        className="absolute bottom-10 px-8 py-4 font-cinzel text-xs tracking-[0.3em] transition-all active:scale-95"
        style={{ border: '1px solid #1f1f1f', color: '#444444' }}>
        NOVO JOGO
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function HostRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [roomCode, setRoomCode] = useState('');
  const [roomUrl, setRoomUrl] = useState('');
  const [players, setPlayers] = useState<ConnectedPlayer[]>([]);
  const [impostors, setImpostors] = useState(parseInt(searchParams.get('impostors') ?? '1'));
  const [myRole, setMyRole] = useState<{ role: 'innocent' | 'impostor'; word: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Voting state
  const [hasRequestedVote, setHasRequestedVote] = useState(false);
  const [voteRequestCount, setVoteRequestCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [allPlayerNums, setAllPlayerNums] = useState<number[]>([]);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [confirmedVote, setConfirmedVote] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [tally, setTally] = useState<TallyEntry[]>([]);
  const [eliminatedNum, setEliminatedNum] = useState<number | null>(null);

  // Refs (safe to read inside PeerJS callbacks)
  const peerRef = useRef<any>(null);
  const playersRef = useRef<ConnectedPlayer[]>([]);
  const counterRef = useRef(2);
  const wordRef = useRef('');
  const impostorNumsRef = useRef<Set<number>>(new Set());
  const hasRequestedVoteRef = useRef(false);
  const voteRequestsRef = useRef<Set<string>>(new Set());
  const votesRef = useRef<Map<string, number>>(new Map());
  const confirmedVoteRef = useRef<number | null>(null);
  const totalPlayersRef = useRef(0);
  const allPlayerNumsRef = useRef<number[]>([]);

  /* ── Stable helpers (only use refs internally) ─────────────── */
  const broadcastAll = useCallback((msg: any) => {
    playersRef.current.forEach(p => { try { p.conn.send(msg); } catch {} });
  }, []);

  const broadcastLobby = useCallback((current: ConnectedPlayer[]) => {
    const list = [{ num: 1 }, ...current.map(p => ({ num: p.num }))];
    current.forEach(p => { try { p.conn.send({ type: 'lobby', players: list }); } catch {} });
  }, []);

  const finalizeVotes = useCallback(() => {
    const nums = allPlayerNumsRef.current;
    const tallyMap = new Map<number, number>(nums.map(n => [n, 0]));

    votesRef.current.forEach(targetNum => {
      tallyMap.set(targetNum, (tallyMap.get(targetNum) ?? 0) + 1);
    });
    if (confirmedVoteRef.current !== null) {
      const t = confirmedVoteRef.current;
      tallyMap.set(t, (tallyMap.get(t) ?? 0) + 1);
    }

    const sorted: TallyEntry[] = Array.from(tallyMap.entries())
      .map(([num, count]) => ({ num, count, isImpostor: impostorNumsRef.current.has(num) }))
      .sort((a, b) => b.count - a.count || a.num - b.num);

    const eliminated = sorted[0].num;
    setTally(sorted);
    setEliminatedNum(eliminated);
    setPhase('results');
    broadcastAll({ type: 'vote_results', tally: sorted.map(({ num, count }) => ({ num, count })), eliminatedNum: eliminated });
  }, [broadcastAll]);

  const triggerVoting = useCallback(() => {
    const playerList = [{ num: 1 }, ...playersRef.current.map(p => ({ num: p.num }))];
    setPhase('voting');
    broadcastAll({ type: 'voting_open', players: playerList });
  }, [broadcastAll]);

  /* ── PeerJS init ─────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;

    const init = async (retryCode?: string) => {
      const { default: Peer } = await import('peerjs');
      const code = retryCode ?? genCode();
      if (!mounted) return;

      setRoomCode(code);
      setRoomUrl(`${window.location.origin}/sala/${code}`);

      const peer = new Peer(`${PEER_PREFIX}${code.toLowerCase()}`);
      peerRef.current = peer;

      peer.on('open', () => { if (mounted) setPhase('lobby'); });
      peer.on('error', (err: any) => {
        if (err.type === 'unavailable-id') { peer.destroy(); if (mounted) init(genCode()); }
      });

      peer.on('connection', (conn: any) => {
        conn.on('open', () => {
          if (!mounted) return;
          const num = counterRef.current++;
          const player: ConnectedPlayer = { peerId: conn.peer, num, conn };
          playersRef.current = [...playersRef.current, player];
          setPlayers([...playersRef.current]);
          broadcastLobby(playersRef.current);
        });

        conn.on('data', (msg: any) => {
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

    fetch('/palavras.txt')
      .then(r => r.text())
      .then(text => {
        const words = text.split('\n').map(w => w.trim()).filter(Boolean);
        wordRef.current = words[Math.floor(Math.random() * words.length)];
      });

    init();
    return () => { mounted = false; peerRef.current?.destroy(); };
  }, [broadcastAll, broadcastLobby, triggerVoting, finalizeVotes]);

  /* ── Game actions ────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    const allSlots = [{ id: 'host', num: 1 }, ...playersRef.current.map(p => ({ id: p.peerId, num: p.num }))];
    const shuffled = shuffle(allSlots);
    const cap = Math.min(impostors, allSlots.length - 1);
    const roleMap = new Map(shuffled.map((s, i) => [s.id, i < cap ? 'impostor' : 'innocent']));

    const nums = allSlots.map(s => s.num);
    allPlayerNumsRef.current = nums;
    totalPlayersRef.current = nums.length;
    setAllPlayerNums(nums);
    setTotalPlayers(nums.length);

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
    broadcastAll({ type: 'impostor_reveal', eliminatedNum, wasImpostor });
    setPhase('reveal');
  }, [eliminatedNum, broadcastAll]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomUrl]);

  const totalInLobby = 1 + players.length;

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
      <VotingScreen
        players={allPlayerNums.map(n => ({ num: n }))}
        myNum={1}
        selectedVote={selectedVote}
        confirmedVote={confirmedVote}
        voteCount={voteCount}
        total={totalPlayers}
        onSelect={setSelectedVote}
        onConfirm={confirmVote}
      />
    );
  }

  /* ── Render: Results ── */
  if (phase === 'results' && eliminatedNum !== null) {
    return (
      <ResultsScreen
        tally={tally}
        eliminatedNum={eliminatedNum}
        isHost={true}
        onReveal={revealImpostor}
      />
    );
  }

  /* ── Render: Reveal ── */
  if (phase === 'reveal' && eliminatedNum !== null) {
    const wasImpostor = impostorNumsRef.current.has(eliminatedNum);
    return (
      <RevealScreen
        eliminatedNum={eliminatedNum}
        wasImpostor={wasImpostor}
        onNewGame={() => router.push('/')}
      />
    );
  }

  /* ── Render: Role ── */
  if (phase === 'role' && myRole) {
    return (
      <div className="grain h-full flex items-center justify-center relative pb-20">
        {myRole.role === 'innocent' ? (
          <div className="flex flex-col items-center justify-center gap-8 px-8 animate-scale-in">
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>
              Você conhece a palavra
            </p>
            <div className="w-20 h-px" style={{ background: 'linear-gradient(90deg, transparent, #1f1f1f, transparent)' }} />
            <p className="font-cinzel font-bold text-center leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 12vw, 5rem)', color: '#f0ede6', letterSpacing: '0.05em', wordBreak: 'break-word' }}>
              {myRole.word.toUpperCase()}
            </p>
          </div>
        ) : (
          <>
            <div className="fixed inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 160px 60px rgba(139,0,0,0.55)' }} />
            <div className="relative flex flex-col items-center justify-center gap-6 px-8 animate-scale-in">
              <p className="text-xs tracking-[0.35em] uppercase" style={{ color: '#c41e1eaa', fontFamily: 'var(--font-inter)' }}>
                Você é o
              </p>
              <h2 className="font-cinzel font-black animate-blood-pulse animate-flicker"
                style={{ fontSize: 'clamp(2.8rem, 13vw, 5.5rem)', color: '#c41e1e', letterSpacing: '0.06em', lineHeight: 1 }}>
                IMPOSTOR
              </h2>
              <div className="w-32 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c41e1e40, transparent)' }} />
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#c41e1e99', fontFamily: 'var(--font-inter)' }}>
                Finja que sabe a palavra
              </p>
            </div>
          </>
        )}
        <VoteRequestBanner
          requested={hasRequestedVote}
          count={voteRequestCount}
          total={totalPlayers}
          onRequest={requestVote}
        />
      </div>
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
        <h1 className="font-cinzel font-bold tracking-[0.3em] text-sm" style={{ color: '#b8860b' }}>SALA</h1>
        <span className="font-cinzel font-bold text-xl" style={{ color: '#f0ede6' }}>{roomCode}</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="p-4" style={{ background: '#f0ede6' }}>
          <QRCodeSVG value={roomUrl} size={180} bgColor="#f0ede6" fgColor="#080808" />
        </div>
        <button onClick={copyLink}
          className="text-xs tracking-[0.25em] uppercase transition-all active:scale-95"
          style={{ color: copied ? '#b8860b' : '#444444', fontFamily: 'var(--font-inter)' }}>
          {copied ? 'link copiado ✓' : 'copiar link'}
        </button>
      </div>

      <div className="flex flex-col gap-0">
        <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#444444', fontFamily: 'var(--font-inter)' }}>
          Jogadores ({totalInLobby})
        </p>
        <div className="flex items-center justify-between py-3 px-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <span className="text-sm" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>Jogador 1</span>
          <span className="text-xs tracking-widest uppercase" style={{ color: '#b8860b', fontFamily: 'var(--font-inter)' }}>você</span>
        </div>
        {players.map(p => (
          <div key={p.peerId} className="flex items-center py-3 px-4 animate-fade-in" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <span className="text-sm" style={{ color: '#888888', fontFamily: 'var(--font-inter)' }}>Jogador {p.num}</span>
          </div>
        ))}
        {totalInLobby < 2 && (
          <p className="text-xs text-center mt-3" style={{ color: '#2a2a2a', fontFamily: 'var(--font-inter)' }}>
            Aguardando jogadores...
          </p>
        )}
      </div>

      <div className="py-4 px-4" style={{ border: '1px solid #1a1a1a' }}>
        <Stepper label="Impostores" value={impostors} min={1} max={Math.max(1, totalInLobby - 1)} onChange={setImpostors} />
      </div>

      <button onClick={startGame} disabled={totalInLobby < 2}
        className="w-full py-5 font-cinzel font-bold tracking-[0.35em] text-sm transition-all active:scale-95"
        style={{
          background: totalInLobby >= 2 ? 'linear-gradient(135deg, #8b0000, #c41e1e)' : '#111111',
          color: totalInLobby >= 2 ? '#f0ede6' : '#2a2a2a',
          border: `1px solid ${totalInLobby >= 2 ? '#c41e1e40' : '#1a1a1a'}`,
        }}>
        INICIAR JOGO
      </button>
    </div>
  );
}
