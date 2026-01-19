import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung - HIER DEINE DATEN EINTRAGEN
const supabaseUrl = 'https://dkjpcdaiftxkpldriuep.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRranBjZGFpZnR4a3BsZHJpdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjYyMjUsImV4cCI6MjA4NDQwMjIyNX0.4-bity8A3jHpjgq6aMyKZb6d_PpkciqSb97socqnJ8E '; 
const TEAM_CODE = "Kallin2026";

const supabase = createClient(supabaseUrl, supabaseKey);

const Leaderboard = ({ matches, players }) => {
  const stats = players.reduce((acc, p) => {
    acc[p.name] = { siege: 0, halved: 0, punkte: 0 };
    return acc;
  }, {});

  matches.forEach(m => {
    if (m.completed) {
      const isAS = m.score === 'AS';
      if (isAS) {
        if (stats[m.player_1]) { stats[m.player_1].halved += 1; stats[m.player_1].punkte += 1; }
        if (stats[m.player_2]) { stats[m.player_2].halved += 1; stats[m.player_2].punkte += 1; }
      } else if (m.winner && stats[m.winner]) {
        stats[m.winner].siege += 1;
        stats[m.winner].punkte += 2;
      }
    }
  });

  const sortedStats = Object.entries(stats).sort((a, b) => {
    if (b[1].punkte !== a[1].punkte) return b[1].punkte - a[1].punkte;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-yellow-500 text-black font-black uppercase text-[10px] tracking-widest">
            <th className="p-4">Name</th>
            <th className="p-4 text-center">Siege</th>
            <th className="p-4 text-center">Halved</th>
            <th className="p-4 text-center border-l border-yellow-600">Punkte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sortedStats.map(([name, s]) => (
            <tr key={name} className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-bold italic">{name}</td>
              <td className="p-4 text-center text-green-400 font-mono text-xl">{s.siege}</td>
              <td className="p-4 text-center text-blue-400 font-mono text-xl">{s.halved}</td>
              <td className="p-4 text-center text-yellow-500 font-black text-2xl border-l border-slate-800">{s.punkte}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: pData } = await supabase.from('players').select('*').order('name');
    const { data: mData } = await supabase.from('matches').select('*').order('round_number, id');
    setPlayers(pData || []);
    setMatches(mData || []);
    setLoading(false);
  }

  const fireVictory = () => {
    const end = Date.now() + (4 * 1000); 
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#D4AF37', '#ffffff', '#004225'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#D4AF37', '#ffffff', '#004225'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const generateInitialMatches = async () => {
    const code = prompt("Admin-Code:");
    if (code !== TEAM_CODE) return;
    const names = ['Alex', 'Fabi', 'Normi', 'Basti', 'Pocki', 'Schwänchen', 'Ben', 'Clemens', 'Daniel', 'Jos', 'Niklas', 'Philipp', 'Migo', 'Maik', 'Illya'];
    let temp = [...names];
    if (temp.length % 2 !== 0) temp.push(null); 
    const all = [];
    const roundsCount = names.length; 
    for (let round = 0; round < roundsCount; round++) {
      for (let i = 0; i < temp.length / 2; i++) {
        const p1 = temp[i];
        const p2 = temp[temp.length - 1 - i];
        if (p1 !== null && p2 !== null) {
          all.push({ player_1: p1, player_2: p2, round_number: round + 1, completed: false });
        }
      }
      temp.splice(1, 0, temp.pop());
    }
    await supabase.from('matches').delete().neq('id', 0);
    await supabase.from('matches').insert(all);
    fetchData();
  };

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code:");
    if (code !== TEAM_CODE) return;

    let scoreInput = prompt("Ergebnis eingeben (Format '3&2' oder 'AS'):");
    if (!scoreInput) return;

    const score = scoreInput.toUpperCase().trim();
    
    // Validierung: Entweder "AS" ODER eine Zahl, gefolgt von "&", gefolgt von einer Zahl
    const scoreRegex = /^\d+&\d+$/;
    if (score !== 'AS' && !scoreRegex.test(score)) {
      alert("Ungültiges Format! Bitte gib das Ergebnis als 'X&Y' (z.B. 3&2) oder 'AS' ein.");
      return;
    }

    const isAS = score === 'AS';

    const { error } = await supabase.from('matches').update({ 
      winner: isAS ? null : winnerName, 
      score: score, 
      completed: true 
    }).eq('id', matchId);

    if (!error) { fireVictory(); fetchData(); }
  };

  const resetMatch = async (matchId) => {
    const code = prompt("Team-Code zum Reset:");
    if (code !== TEAM_CODE) return;
    await supabase.from('matches').update({ winner: null, score: null, completed: false }).eq('id', matchId);
    fetchData();
  };

  const groupedMatches = matches.reduce((acc, m) => {
    const r = m.round_number || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});
  const roundKeys = Object.keys(groupedMatches).sort((a, b) => a - b);

  const bgUrl = "https://raw.githubusercontent.com/keytunec/GCKallin-BattleMode/main/Gemini_Generated_Image_mk0buymk0buymk0b.png";

  return (
    <div className="min-h-screen text-white font-sans relative bg-black text-xs md:text-sm">
      <div className="fixed inset-0 z-0 bg-cover bg-center no-repeat" style={{ backgroundImage: `url("${bgUrl}")` }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-10">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-yellow-500 drop-shadow-2xl">Kallin Arena</h1>
        </header>

        <nav className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab('matches')} className={`px-6 py-2 md:px-8 md:py-3 rounded-full font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' : 'bg-slate-800'}`}>Battles</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`px-6 py-2 md:px-8 md:py-3 rounded-full font-black uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' : 'bg-slate-800'}`}>Tabelle</button>
        </nav>

        {loading ? (
          <div className="text-center py-20 text-yellow-500 font-black animate-pulse">LADE ARENA...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'matches' && (
              matches.length === 0 ? (
                <div className="text-center p-10 bg-black/60 rounded-xl border-2 border-dashed border-slate-700">
                  <button onClick={generateInitialMatches} className="bg-red-600 px-6 py-3 rounded font-bold uppercase hover:bg-red-700 transition">Turnierplan generieren</button>
                </div>
              ) : (
                roundKeys.map(rNum => {
                  const roundMatches = groupedMatches[rNum];
                  const playersInRound = new Set();
                  roundMatches.forEach(m => { playersInRound.add(m.player_1); playersInRound.add(m.player_2); });
                  const byePlayer = players.find(p => !playersInRound.has(p.name));

                  return (
                    <details key={rNum} className="group bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl mb-4">
                      <summary className="p-4 md:p-5 cursor-pointer flex justify-between items-center font-black uppercase text-yellow-500 group-open:bg-yellow-500 group-open:text-black transition-all">
                        <span>Runde {rNum}</span>
                        {byePlayer && <span className="text-[9px] uppercase tracking-tighter opacity-70 italic">Spielfrei: {byePlayer.name}</span>}
                      </summary>
                      <div className="p-3 md:p-4 grid gap-3 bg-black/40 border-t border-white/5">
                        {roundMatches.map(m => (
                          <div key={m.id} className={`relative p-3 md:p-4 rounded-xl border-2 flex items-center justify-between transition-all ${m.completed ? 'border-green-600/50 bg-green-950/20' : 'border-white/5 bg-slate-900/80 shadow-lg'}`}>
                            
                            {/* Player 1 */}
                            <button 
                              disabled={m.completed} 
                              onClick={() => handleWin(m.id, m.player_1)} 
                              className={`flex-1 font-bold text-sm md:text-xl truncate text-right pr-2 md:pr-4 ${m.winner === m.player_1 ? 'text-yellow-400 font-black scale-105' : 'text-white'}`}
                            >
                              {m.player_1}
                            </button>

                            {/* Ergebnis-Mitte (ersetzt VS) */}
                            <div className="flex-none px-2 min-w-[60px] text-center">
                              {m.completed ? (
                                <div className="flex items-center justify-center gap-1 font-black italic text-base md:text-2xl drop-shadow-md">
                                  {m.score === 'AS' ? (
                                    <span className="text-yellow-500">AS</span>
                                  ) : (
                                    <>
                                      <span className="text-red-600">{m.score.split('&')[0]}</span>
                                      <span className="text-slate-500 text-xs md:text-sm">&</span>
                                      <span className="text-blue-500">{m.score.split('&')[1]}</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-600 font-black italic uppercase">vs</div>
                              )}
                            </div>

                            {/* Player 2 */}
                            <button 
                              disabled={m.completed} 
                              onClick={() => handleWin(m.id, m.player_2)} 
                              className={`flex-1 font-bold text-sm md:text-xl truncate text-left pl-2 md:pl-4 ${m.winner === m.player_2 ? 'text-yellow-400 font-black scale-105' : 'text-white'}`}
                            >
                              {m.player_2}
                            </button>

                            {/* Reset Button */}
                            {m.completed && (
                              <button onClick={() => resetMatch(m.id)} className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center hover:scale-125 transition shadow-lg z-20">×</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })
              )
            )}
            {activeTab === 'leaderboard' && <Leaderboard matches={matches} players={players} />}
          </div>
        )}
      </div>
    </div>
  );
}
