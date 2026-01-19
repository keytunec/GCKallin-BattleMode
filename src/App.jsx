```jsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import image_0 from './image_0.png'; // Stellen Sie sicher, dass das Bild im src-Ordner liegt

// 1. Initialisierung
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026";

// Hilfskomponente für die Tabelle (Leaderboard)
const Leaderboard = ({ matches, players }) => {
  const stats = {};
  players.forEach(p => stats[p.name] = 0);
  matches.forEach(m => {
    if (m.completed && m.winner) {
      stats[m.winner] = (stats[m.winner] || 0) + 1;
    }
  });

  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 p-3 text-black font-black uppercase text-center tracking-widest">
        Rangliste (Siege)
      </div>
      <table className="w-full text-left">
        <tbody>
          {sortedStats.map(([name, wins], index) => (
            <tr key={name} className="border-b border-slate-700/50 hover:bg-slate-700/30 text-white">
              <td className="p-4 font-mono text-yellow-500 w-16 text-center">#{index + 1}</td>
              <td className="p-4 font-bold">{name}</td>
              <td className="p-4 text-right font-black text-green-400">{wins} Siege</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Komponente für eine einzelne Runde (Einklappbare Liste)
const MatchRound = ({ roundNumber, matches, onWin }) => {
  return (
    <details className="group mb-4 rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-slate-900/80 backdrop-blur-md open:border-yellow-500/50 transition-all">
      <summary className="flex justify-between items-center p-5 cursor-pointer font-black uppercase tracking-widest hover:bg-slate-800/50 transition-colors">
        <span className="text-yellow-500">Runde {roundNumber}</span>
        <span className="text-slate-400 text-sm group-open:hidden transition-all">Anzeigen</span>
        <span className="text-slate-400 text-sm hidden group-open:inline transition-all">Verbergen</span>
      </summary>
      <div className="p-4 grid gap-4 bg-slate-900/50">
        {matches.map((match) => (
          <div key={match.id} className={`relative overflow-hidden border-2 p-6 rounded-xl transition-all ${match.completed ? 'border-green-600 bg-green-950/20' : 'border-slate-700 bg-slate-800 shadow-lg'}`}>
            <div className="flex justify-between items-center relative z-10">
              <button onClick={() => !match.completed && onWin(match.id, match.player_1)} className={`flex-1 text-xl md:text-2xl font-bold p-4 rounded hover:bg-slate-700 transition ${match.winner === match.player_1 ? 'text-yellow-400' : ''}`}>
                {match.player_1}
              </button>
              <div className="px-4 text-slate-500 font-black italic">VS</div>
              <button onClick={() => !match.completed && onWin(match.id, match.player_2)} className={`flex-1 text-xl md:text-2xl font-bold p-4 rounded hover:bg-slate-700 transition ${match.winner === match.player_2 ? 'text-yellow-400' : ''}`}>
                {match.player_2}
              </button>
            </div>
            {match.completed && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-0.5 rounded-b-lg font-bold text-xs uppercase shadow-md">
                Winner: {match.winner} ({match.score})
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  );
};

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' oder 'leaderboard'

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: mData } = await supabase.from('matches').select('*').order('id', { ascending: true });
    const { data: pData } = await supabase.from('players').select('name');
    setMatches(mData || []);
    setPlayers(pData || []);
    setLoading(false);
  }

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code eingeben:");
    if (code !== TEAM_CODE) return alert("Falscher Code!");
    const score = prompt("Ergebnis (z.B. 3&2):");

    const { error } = await supabase
      .from('matches')
      .update({ winner: winnerName, score: score, completed: true })
      .eq('id', matchId);

    if (!error) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#ffffff', '#004225'] });
      fetchData();
    }
  };

  // Logik um Matches in Runden zu gruppieren (z.B. 7 Runden à 15 Matches)
  const rounds = [];
  if (matches.length > 0) {
    const matchesPerRound = Math.ceil(matches.length / 7); // Teile 105 Matches in 7 Runden auf
    for (let i = 0; i < 7; i++) {
      rounds.push(matches.slice(i * matchesPerRound, (i + 1) * matchesPerRound));
    }
  }

  return (
    <div className="min-h-screen text-white font-sans relative">
      {/* Hintergrundbild */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{ backgroundImage: `url(${image_0})` }}
      >
        <div className="absolute inset-0 bg-slate-900/70"></div> {/* Dunkler Overlay */}
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-10">
          <h1 className="text-5xl font-black tracking-tighter italic uppercase text-yellow-500 drop-shadow-lg">Kallin Battle Arena</h1>
          <p className="text-slate-300 mt-2 italic font-bold drop-shadow-md">Herrenmannschaft Season 2026</p>
        </header>

        {/* Navigation / Tabs */}
        <div className="flex justify-center mb-8 space-x-4">
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 font-black uppercase tracking-widest rounded-full transition-all ${activeTab === 'matches' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Matches
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-black uppercase tracking-widest rounded-full transition-all ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Rangliste
          </button>
        </div>

        {/* Inhalt je nach aktivem Tab */}
        {loading ? (
          <div className="text-center text-yellow-500 font-bold text-xl mt-10">Lade Daten...</div>
        ) : (
          <>
            {activeTab === 'matches' && (
              <div className="grid gap-4">
                {rounds.map((roundMatches, index) => (
                  <MatchRound 
                    key={index} 
                    roundNumber={index + 1} 
                    matches={roundMatches} 
                    onWin={handleWin} 
                  />
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <Leaderboard matches={matches} players={players} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

```
