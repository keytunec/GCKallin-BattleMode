import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026";

const Leaderboard = ({ matches, players }) => {
  // Wir erstellen eine Map mit allen Spielern, damit auch Leute mit 0 Punkten erscheinen
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

  // Sortierung: Zuerst nach Punkten, dann alphabetisch nach Namen
  const sortedEntries = Object.entries(stats).sort((a, b) => {
    if (b[1].punkte !== a[1].punkte) return b[1].punkte - a[1].punkte;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-yellow-500 text-black font-black uppercase text-xs">
            <th className="p-4">Name</th>
            <th className="p-4 text-center">Siege</th>
            <th className="p-4 text-center">Halved</th>
            <th className="p-4 text-center">Punkte</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map(([name, s]) => (
            <tr key={name} className="border-b border-slate-700/50 text-white">
              <td className="p-4 font-bold italic">{name}</td>
              <td className="p-4 text-center text-green-400 font-bold">{s.siege}</td>
              <td className="p-4 text-center text-blue-400 font-bold">{s.halved}</td>
              <td className="p-4 text-center text-yellow-500 font-black">{s.punkte}</td>
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
    const { data: mData } = await supabase.from('matches').select('*').order('id');
    setPlayers(pData || []);
    setMatches(mData || []);
    setLoading(false);
  }

  const generateInitialMatches = async () => {
    const code = prompt("Admin-Code:");
    if (code !== TEAM_CODE) return;
    const names = players.map(p => p.name);
    const all = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        all.push({ player_1: names[i], player_2: names[j], completed: false });
      }
    }
    await supabase.from('matches').insert(all);
    fetchData();
  };

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code:");
    if (code !== TEAM_CODE) return;
    const score = prompt("Ergebnis (z.B. 3&2 oder AS):");
    if (!score) return;
    const isAS = score.toUpperCase() === 'AS';
    await supabase.from('matches').update({ 
      winner: isAS ? null : winnerName, 
      score: score.toUpperCase(), 
      completed: true 
    }).eq('id', matchId);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    fetchData();
  };

  // Hilfsvariable für das Hintergrundbild (relativ zum Base-Pfad)
  const bgUrl = `${import.meta.env.BASE_URL}bg.jpg`;

  return (
    <div className="min-h-screen text-white font-sans relative bg-slate-900">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-12">
          <h1 className="text-6xl font-black italic uppercase text-yellow-500 drop-shadow-2xl">Kallin Arena</h1>
          <p className="text-slate-300 font-bold uppercase tracking-widest text-sm mt-2">Team Championship 2026</p>
        </header>

        <nav className="flex justify-center gap-4 mb-10">
          <button onClick={() => setActiveTab('matches')} className={`px-8 py-3 rounded-full font-black uppercase text-sm ${activeTab === 'matches' ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>Matches</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`px-8 py-3 rounded-full font-black uppercase text-sm ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}>Leaderboard</button>
        </nav>

        {loading ? (
          <div className="text-center text-yellow-500 font-black animate-pulse">LOADING DATA...</div>
        ) : (
          <div className="space-y-6">
            {matches.length === 0 && (
              <div className="text-center p-10 bg-black/40 rounded-xl border-2 border-dashed border-slate-700">
                <p className="mb-4 text-slate-400">Noch keine Matches vorhanden.</p>
                <button onClick={generateInitialMatches} className="bg-red-600 px-6 py-3 rounded font-bold uppercase">Admin: Initialisieren</button>
              </div>
            )}

            {activeTab === 'matches' && matches.length > 0 && (
              <div className="grid gap-4">
                {/* Hier könntest du die Runden-Logik von oben wieder einfügen */}
                {matches.map(m => (
                  <div key={m.id} className={`p-5 rounded-xl border-2 flex items-center justify-between transition-all ${m.completed ? 'border-green-600/50 bg-green-900/20' : 'border-white/5 bg-slate-800/40'}`}>
                    <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_1)} className={`flex-1 font-bold text-xl ${m.winner === m.player_1 ? 'text-yellow-400' : ''}`}>{m.player_1}</button>
                    <div className="px-4 text-slate-500 font-black italic">VS</div>
                    <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_2)} className={`flex-1 font-bold text-xl ${m.winner === m.player_2 ? 'text-yellow-400' : ''}`}>{m.player_2}</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && <Leaderboard matches={matches} players={players} />}
          </div>
        )}
      </div>
    </div>
  );
}
