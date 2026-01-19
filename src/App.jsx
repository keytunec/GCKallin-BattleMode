import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// --- HIER DEINE ECHTEN DATEN EINTRAGEN ---
const supabaseUrl = 'https://dkjpcdaiftxkpldriuep.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRranBjZGFpZnR4a3BsZHJpdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjYyMjUsImV4cCI6MjA4NDQwMjIyNX0.4-bity8A3jHpjgq6aMyKZb6d_PpkciqSb97socqnJ8E'; 
const TEAM_CODE = "Kallin2026";

const supabase = createClient(supabaseUrl, supabaseKey);

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    setErrorMsg(null);
    
    // Abfrage der Daten
    const { data: pData, error: pErr } = await supabase.from('players').select('*').order('name');
    const { data: mData, error: mErr } = await supabase.from('matches').select('*').order('id');
    
    if (pErr || mErr) {
      setErrorMsg(`Datenbank-Fehler: ${pErr?.message || mErr?.message}`);
      setLoading(false);
      return;
    }

    if (!pData || pData.length === 0) {
      setErrorMsg("Keine Spieler in der Tabelle 'players' gefunden!");
    }

    setPlayers(pData || []);
    setMatches(mData || []);
    setLoading(false);
  }

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code:");
    if (code !== TEAM_CODE) return alert("Falscher Code!");
    const score = prompt("Ergebnis (z.B. 3&2 oder AS für Unentschieden):");
    if (!score) return;

    const isAS = score.toUpperCase() === 'AS';
    const { error } = await supabase.from('matches').update({ 
      winner: isAS ? null : winnerName, 
      score: score.toUpperCase(), 
      completed: true 
    }).eq('id', matchId);

    if (error) alert("Fehler beim Speichern: " + error.message);
    else { confetti({ particleCount: 150 }); fetchData(); }
  };

  const calculateLeaderboard = () => {
    const stats = players.reduce((acc, p) => {
      acc[p.name] = { siege: 0, halved: 0, punkte: 0 };
      return acc;
    }, {});

    matches.forEach(m => {
      if (m.completed) {
        if (m.score === 'AS') {
          if (stats[m.player_1]) { stats[m.player_1].halved += 1; stats[m.player_1].punkte += 1; }
          if (stats[m.player_2]) { stats[m.player_2].halved += 1; stats[m.player_2].punkte += 1; }
        } else if (m.winner && stats[m.winner]) {
          stats[m.winner].siege += 1;
          stats[m.winner].punkte += 2;
        }
      }
    });

    return Object.entries(stats).sort((a, b) => {
      if (b[1].punkte !== a[1].punkte) return b[1].punkte - a[1].punkte;
      return a[0].localeCompare(b[0]);
    });
  };

  const matchesPerRound = 15;
  const rounds = [];
  for (let i = 0; i < Math.ceil(matches.length / matchesPerRound); i++) {
    rounds.push(matches.slice(i * matchesPerRound, (i + 1) * matchesPerRound));
  }

  const bgUrl = `${import.meta.env.BASE_URL}Gemini_Generated_Image_mk0buymk0buymk0b.jpg`;

  return (
    <div className="min-h-screen text-white font-sans relative bg-slate-900">
      <div className="fixed inset-0 z-0 bg-cover bg-center no-repeat" style={{ backgroundImage: `url(${bgUrl})` }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-10">
          <h1 className="text-5xl font-black italic uppercase text-yellow-500 tracking-tighter">Kallin Arena</h1>
        </header>

        <nav className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab('matches')} className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'matches' ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'}`}>Matches</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'}`}>Leaderboard</button>
        </nav>

        {errorMsg && (
          <div className="bg-red-600/80 border-2 border-red-400 p-6 rounded-2xl mb-8 text-center font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-yellow-500 font-black animate-pulse uppercase">Lade Arena...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'matches' && rounds.map((rMatches, rIdx) => (
              <details key={rIdx} className="group bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <summary className="p-5 cursor-pointer flex justify-between items-center font-black uppercase text-yellow-500 group-open:bg-yellow-500 group-open:text-black transition-all">
                  Runde {rIdx + 1}
                  <span className="text-[10px] px-3 py-1 border border-current rounded-full italic">Ansehen</span>
                </summary>
                <div className="p-4 grid gap-3 bg-black/30 border-t border-white/5">
                  {rMatches.map(m => (
                    <div key={m.id} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${m.completed ? 'border-green-600/50 bg-green-900/20' : 'border-white/5 bg-slate-900/80'}`}>
                      <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_1)} className={`flex-1 font-bold text-center ${m.winner === m.player_1 ? 'text-yellow-400' : 'text-white'}`}>{m.player_1}</button>
                      <div className="px-2 text-[10px] text-slate-600 font-black italic">vs</div>
                      <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_2)} className={`flex-1 font-bold text-center ${m.winner === m.player_2 ? 'text-yellow-400' : ''}`}>{m.player_2}</button>
                    </div>
                  ))}
                </div>
              </details>
            ))}

            {activeTab === 'leaderboard' && (
              <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-yellow-500 text-black font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-center">Siege</th>
                      <th className="p-4 text-center">Halved</th>
                      <th className="p-4 text-center">Punkte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {calculateLeaderboard().map(([name, s]) => (
                      <tr key={name} className="hover:bg-white/5">
                        <td className="p-4 font-bold italic">{name}</td>
                        <td className="p-4 text-center text-green-400 font-mono text-lg">{s.siege}</td>
                        <td className="p-4 text-center text-blue-400 font-mono text-lg">{s.halved}</td>
                        <td className="p-4 text-center text-yellow-500 font-black text-xl">{s.punkte}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
