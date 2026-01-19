import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung (URL und Key prüfen!)
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026";

const Leaderboard = ({ matches, players }) => {
  // Berechnung der Statistiken
  const stats = players.reduce((acc, p) => {
    acc[p.name] = { siege: 0, halved: 0, punkte: 0 };
    return acc;
  }, {});

  matches.forEach(m => {
    if (m.completed) {
      if (m.winner && m.winner !== 'AS') {
        if (stats[m.winner]) {
          stats[m.winner].siege += 1;
          stats[m.winner].punkte += 2;
        }
      } else if (m.score && (m.score.toUpperCase() === 'AS' || m.score.toLowerCase() === 'halved')) {
        if (stats[m.player_1] && stats[m.player_2]) {
          stats[m.player_1].halved += 1;
          stats[m.player_1].punkte += 1;
          stats[m.player_2].halved += 1;
          stats[m.player_2].punkte += 1;
        }
      }
    }
  });

  // Sortierung: Erst nach Punkten, dann alphabetisch
  const sortedPlayers = Object.entries(stats).sort((a, b) => {
    if (b[1].punkte !== a[1].punkte) return b[1].punkte - a[1].punkte;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-yellow-500 text-black font-black uppercase text-xs tracking-widest">
            <th className="p-4">Name</th>
            <th className="p-4 text-center">Siege</th>
            <th className="p-4 text-center">Halved</th>
            <th className="p-4 text-center font-black">Punkte</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(([name, data]) => (
            <tr key={name} className="border-b border-slate-700/50 hover:bg-slate-700/30 text-white">
              <td className="p-4 font-bold">{name}</td>
              <td className="p-4 text-center text-green-400">{data.siege}</td>
              <td className="p-4 text-center text-blue-400">{data.halved}</td>
              <td className="p-4 text-center font-black text-yellow-500">{data.punkte}</td>
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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: pData } = await supabase.from('players').select('*').order('name', { ascending: true });
    const { data: mData } = await supabase.from('matches').select('*').order('id', { ascending: true });
    setPlayers(pData || []);
    setMatches(mData || []);
    setLoading(false);
  }

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code:");
    if (code !== TEAM_CODE) return alert("Falsch!");
    
    const score = prompt("Ergebnis (z.B. 3&2 oder AS für Unentschieden):");
    if (!score) return;

    // Falls Unentschieden (AS), gibt es keinen winnerName
    const isAS = score.toUpperCase() === 'AS';
    
    const { error } = await supabase
      .from('matches')
      .update({ 
        winner: isAS ? null : winnerName, 
        score: score, 
        completed: true 
      })
      .eq('id', matchId);

    if (!error) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      fetchData();
    }
  };

  const rounds = [];
  const matchesPerRound = 15;
  for (let i = 0; i < Math.ceil(matches.length / matchesPerRound); i++) {
    rounds.push(matches.slice(i * matchesPerRound, (i + 1) * matchesPerRound));
  }

  // Korrekter Bildpfad für GitHub Pages
  const bgImage = `${import.meta.env.BASE_URL}Gemini_Generated_Image_mk0buymk0buymk0b.jpg`;

  return (
    <div className="min-h-screen text-white font-sans relative bg-slate-900">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-10">
          <h1 className="text-5xl font-black italic uppercase text-yellow-500 tracking-tighter">Kallin Battle</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Matchplay Season 2026</p>
        </header>

        <nav className="flex justify-center gap-4 mb-8">
          {['matches', 'leaderboard'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-black uppercase text-sm transition-all ${activeTab === tab ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            >
              {tab === 'matches' ? 'BATTLES' : 'TABELLE'}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="text-center text-yellow-500 font-bold">LADE DATEN...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'matches' ? (
              rounds.map((roundMatches, rIdx) => (
                <details key={rIdx} className="group bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  <summary className="p-4 cursor-pointer flex justify-between items-center font-black uppercase text-yellow-500 select-none">
                    Runde {rIdx + 1}
                    <span className="text-[10px] bg-yellow-500 text-black px-2 py-1 rounded">KLICKEN</span>
                  </summary>
                  <div className="p-4 grid gap-3 border-t border-white/5">
                    {roundMatches.map(m => (
                      <div key={m.id} className={`p-4 rounded-lg border-2 flex items-center justify-between ${m.completed ? 'border-green-600/50 bg-green-900/20' : 'border-white/10 bg-black/40'}`}>
                        <button onClick={() => !m.completed && handleWin(m.id, m.player_1)} className={`flex-1 font-bold ${m.winner === m.player_1 ? 'text-yellow-400' : 'text-white'}`}>
                          {m.player_1}
                        </button>
                        <div className="px-4 text-[10px] text-slate-500 font-black italic">VS</div>
                        <button onClick={() => !m.completed && handleWin(m.id, m.player_2)} className={`flex-1 font-bold ${m.winner === m.player_2 ? 'text-yellow-400' : 'text-white'}`}>
                          {m.player_2}
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              ))
            ) : (
              <Leaderboard matches={matches} players={players} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
