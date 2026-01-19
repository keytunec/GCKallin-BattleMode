import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// Supabase Initialisierung (DEINE DATEN HIER)
const supabase = createClient('DEINE_SUPABASE_URL', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026"; // Dein "Passwort"

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

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code eingeben:");
    if (code !== TEAM_CODE) return alert("Falscher Code!");

    const score = prompt("Ergebnis eingeben (z.B. 3&2):");

    const { error } = await supabase
      .from('matches')
      .update({ winner: winnerName, score: score, completed: true })
      .eq('id', matchId);

    if (!error) {
      // FEUERWERK!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#ffffff', '#004225'] // Gold, Weiß, Kallin-Grün
      });
      fetchMatches();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 font-sans">
      <header className="text-center py-10">
        <h1 className="text-5xl font-black tracking-tighter italic uppercase text-yellow-500">
          Kallin Battle Arena
        </h1>
        <p className="text-slate-400 mt-2">Herrenmannschaft Season 2026</p>
      </header>

      <div className="max-w-4xl mx-auto grid gap-4">
        {matches.map((match) => (
          <div key={match.id} className={`relative overflow-hidden border-2 p-6 rounded-xl transition-all ${match.completed ? 'border-green-600 bg-green-950/20' : 'border-slate-700 bg-slate-800'}`}>
            <div className="flex justify-between items-center">
              {/* Player 1 */}
              <button 
                onClick={() => !match.completed && handleWin(match.id, match.player_1)}
                className={`flex-1 text-2xl font-bold p-4 rounded hover:bg-slate-700 transition ${match.winner === match.player_1 ? 'text-yellow-400' : ''}`}
              >
                {match.player_1}
              </button>

              <div className="px-4 text-slate-500 font-black">VS</div>

              {/* Player 2 */}
              <button 
                onClick={() => !match.completed && handleWin(match.id, match.player_2)}
                className={`flex-1 text-2xl font-bold p-4 rounded hover:bg-slate-700 transition ${match.winner === match.player_2 ? 'text-yellow-400' : ''}`}
              >
                {match.player_2}
              </button>
            </div>

            {match.completed && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-b-lg font-bold text-sm uppercase">
                Winner: {match.winner} ({match.score})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
