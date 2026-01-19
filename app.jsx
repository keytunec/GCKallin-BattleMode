import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026";

// Hilfskomponente für die Tabelle
const Leaderboard = ({ matches }) => {
  // Wir berechnen die Punkte live aus den abgeschlossenen Matches
  const stats = {};
  matches.forEach(m => {
    if (m.completed && m.winner) {
      stats[m.winner] = (stats[m.winner] || 0) + 1;
    }
  });

  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-4xl mx-auto mb-12 bg-slate-800 border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-yellow-500 p-3 text-black font-black uppercase text-center tracking-widest">
        Standings (Siege)
      </div>
      <table className="w-full text-left">
        <tbody>
          {sortedStats.map(([name, wins], index) => (
            <tr key={name} className="border-b border-slate-700/50 hover:bg-slate-700/30 text-white">
              <td className="p-4 font-mono text-yellow-500 w-16">#{index + 1}</td>
              <td className="p-4 font-bold">{name}</td>
              <td className="p-4 text-right font-black text-green-400">{wins} Siege</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    const { data } = await supabase.from('matches').select('*').order('id', { ascending: true });
    setMatches(data || []);
    setLoading(false);
  }

  const generateInitialMatches = async () => {
    const names = ['Alex', 'Fabi', 'Normi', 'Basti', 'Pocki', 'Schwänchen', 'Ben', 'Clemens', 'Daniel', 'Jos', 'Niklas', 'Philipp', 'Migo', 'Maik', 'Illya'];
    const allMatches = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        allMatches.push({ player_1: names[i], player_2: names[j], completed: false });
      }
    }
    const { error } = await supabase.from('matches').insert(allMatches);
    if (!error) { alert("105 Matches erstellt!"); fetchMatches(); }
  };

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
      fetchMatches();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 font-sans">
      <header className="text-center py-10">
        <h1 className="text-5xl font-black tracking-tighter italic uppercase text-yellow-500">Kallin Battle Arena</h1>
        <p className="text-slate-400 mt-2 italic">Official Herrenmannschaft Matchplay 2026</p>
      </header>

      {/* Leaderboard anzeigen */}
      <Leaderboard matches={matches} />

      {/* Admin Button (Solltest du nach dem ersten Mal löschen) */}
      {matches.length === 0 && (
        <div className="text-center mb-8">
            <button onClick={generateInitialMatches} className="bg-red-600 hover:bg-red-700 p-4 font-bold rounded-lg transition">
                🚀 INITIALISIEREN: 105 MATCHES ERSTELLEN
            </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto grid gap-4">
        {matches.map((match) => (
          <div key={match.id} className={`relative overflow-hidden border-2 p-6 rounded-xl transition-all ${match.completed ? 'border-green-600 bg-green-950/20' : 'border-slate-700 bg-slate-800 shadow-lg'}`}>
            <div className="flex justify-between items-center relative z-10">
              <button onClick={() => !match.completed && handleWin(match.id, match.player_1)} className={`flex-1 text-xl md:text-2xl font-bold p-4 rounded hover:bg-slate-700 transition ${match.winner === match.player_1 ? 'text-yellow-400' : ''}`}>
                {match.player_1}
              </button>
              <div className="px-4 text-slate-500 font-black italic">VS</div>
              <button onClick={() => !match.completed && handleWin(match.id, match.player_2)} className={`flex-1 text-xl md:text-2xl font-bold p-4 rounded hover:bg-slate-700 transition ${match.winner === match.player_2 ? 'text-yellow-400' : ''}`}>
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
    </div>
  );
}
