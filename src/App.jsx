import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung - PRÜFE BITTE DEINE URL UND KEY!
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026";

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    // Holen der Spieler und Matches
    const { data: pData, error: pErr } = await supabase.from('players').select('*').order('name', { ascending: true });
    const { data: mData, error: mErr } = await supabase.from('matches').select('*').order('id', { ascending: true });
    
    if (pErr) console.error("Fehler Spieler:", pErr);
    if (mErr) console.error("Fehler Matches:", mErr);

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
    const { error } = await supabase
      .from('matches')
      .update({ 
        winner: isAS ? null : winnerName, 
        score: score.toUpperCase(), 
        completed: true 
      })
      .eq('id', matchId);

    if (!error) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      fetchData();
    }
  };

  // Berechnung der Statistiken für das Leaderboard
  const calculateStats = () => {
    const stats = players.reduce((acc, p) => {
      acc[p.name] = { siege: 0, halved: 0, punkte: 0 };
      return acc;
    }, {});

    matches.forEach(m => {
      if (m.completed) {
        const isAS = m.score && m.score.toUpperCase() === 'AS';
        if (isAS) {
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
      return a[0].localeCompare(b[0]); // Alphabetisch sortieren
    });
  };

  // Hintergrundbild Pfad
  const bgUrl = `${import.meta.env.BASE_URL}bg.jpg`;

  return (
    <div className="min-h-screen text-white font-sans relative bg-slate-900">
      {/* Hintergrundbild */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-10">
          <h1 className="text-5xl font-black italic uppercase text-yellow-500 tracking-tighter drop-shadow-lg">Kallin Arena</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">Season 2026</p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('matches')} 
            className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'matches' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800 text-slate-400'}`}
          >
            Matches
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')} 
            className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800 text-slate-400'}`}
          >
            Leaderboard
          </button>
        </nav>

        {loading ? (
          <div className="text-center text-yellow-500 font-black animate-pulse py-20">ABRUFEN DER BATTLE-DATEN...</div>
        ) : (
          <div className="space-y-4">
            {/* Matches Tab */}
            {activeTab === 'matches' && (
              matches.length === 0 ? (
                <div className="text-center p-10 bg-black/40 border-2 border-dashed border-slate-700 rounded-2xl">
                   <p className="text-slate-500 italic mb-4">Keine Matches in der Datenbank gefunden.</p>
                   <p className="text-xs text-slate-600">Prüfe Supabase RLS Einstellungen!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {matches.map(m => (
                    <div key={m.id} className={`p-4 rounded-xl border-2 flex items-center justify-between shadow-lg transition-all ${m.completed ? 'border-green-600/50 bg-green-900/20' : 'border-white/5 bg-slate-900/60'}`}>
                      <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_1)} className={`flex-1 font-bold text-lg md:text-xl truncate ${m.winner === m.player_1 ? 'text-yellow-400' : 'text-white'}`}>{m.player_1}</button>
                      <div className="px-3 text-[10px] text-slate-500 font-black italic">VS</div>
                      <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_2)} className={`flex-1 font-bold text-lg md:text-xl truncate ${m.winner === m.player_2 ? 'text-yellow-400' : ''}`}>{m.player_2}</button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-yellow-500 text-black font-black uppercase text-[10px] tracking-tighter">
                      <th className="p-4">Name</th>
                      <th className="p-4 text-center">Siege</th>
                      <th className="p-4 text-center">Halved</th>
                      <th className="p-4 text-center">Punkte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {calculateStats().map(([name, s]) => (
                      <tr key={name} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-sm italic">{name}</td>
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
