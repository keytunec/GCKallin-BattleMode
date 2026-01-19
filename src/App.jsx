import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'DEIN_ANON_KEY');
const TEAM_CODE = "Kallin2026";

// Hilfskomponente für die Tabelle (Leaderboard)
const Leaderboard = ({ matches }) => {
  const stats = {};
  matches.forEach(m => {
    if (m.completed && m.winner) {
      stats[m.winner] = (stats[m.winner] || 0) + 1;
    }
  });

  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-yellow-500 p-3 text-black font-black uppercase text-center tracking-widest">
        Standings
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <tbody>
            {sortedStats.map(([name, wins], index) => (
              <tr key={name} className="border-b border-slate-700/50 hover:bg-slate-700/30 text-white">
                <td className="p-4 font-mono text-yellow-500 w-16 text-center">#{index + 1}</td>
                <td className="p-4 font-bold italic">{name}</td>
                <td className="p-4 text-right font-black text-green-400 uppercase">{wins} Wins</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

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
    const score = prompt("Ergebnis (z.B. 3&2):");

    const { error } = await supabase
      .from('matches')
      .update({ winner: winnerName, score: score, completed: true })
      .eq('id', matchId);

    if (!error) {
      confetti({ 
        particleCount: 150, 
        spread: 70, 
        origin: { y: 0.6 }, 
        colors: ['#D4AF37', '#ffffff', '#004225'] 
      });
      fetchMatches();
    }
  };

  // Gruppierung der 105 Matches in logische Runden (z.B. 10 Runden)
  const rounds = [];
  const matchesPerRound = 11;
  for (let i = 0; i < Math.ceil(matches.length / matchesPerRound); i++) {
    rounds.push(matches.slice(i * matchesPerRound, (i + 1) * matchesPerRound));
  }

  return (
    <div className="min-h-screen text-white font-sans relative">
      {/* Hintergrundbild - Pfad anpassen an deinen Dateinamen */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('./Gemini_Generated_Image_mk0buymk0buymk0b.jpg')",
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-12">
          <h1 className="text-6xl font-black tracking-tighter italic uppercase text-yellow-500 drop-shadow-2xl mb-2">
            Kallin Arena
          </h1>
          <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full mb-4"></div>
          <p className="text-slate-200 font-bold uppercase tracking-widest">Team Championship 2026</p>
        </header>

        {/* Navigation / Tabs */}
        <nav className="flex justify-center gap-2 mb-10">
          <button 
            onClick={() => setActiveTab('matches')}
            className={activeTab === 'matches' 
              ? "bg-yellow-500 text-black px-8 py-3 rounded-full font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
              : "bg-slate-800/80 text-white px-8 py-3 rounded-full font-black uppercase tracking-wider hover:bg-slate-700 transition-all"}
          >
            Matches
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={activeTab === 'leaderboard' 
              ? "bg-yellow-500 text-black px-8 py-3 rounded-full font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
              : "bg-slate-800/80 text-white px-8 py-3 rounded-full font-black uppercase tracking-wider hover:bg-slate-700 transition-all"}
          >
            Leaderboard
          </button>
        </nav>

        {loading ? (
          <div className="text-center py-20 font-black text-yellow-500 animate-pulse">LOADING BATTLE DATA...</div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'matches' ? (
              rounds.map((roundMatches, rIdx) => (
                <details key={rIdx} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                  <summary className="list-none p-6 cursor-pointer flex justify-between items-center group-open:bg-yellow-500 group-open:text-black transition-all">
                    <h3 className="text-xl font-black uppercase italic tracking-widest">Runde {rIdx + 1}</h3>
                    <div className="font-bold text-sm uppercase px-3 py-1 border border-current rounded-full">
                      {roundMatches.filter(m => m.completed).length} / {roundMatches.length} Done
                    </div>
                  </summary>
                  
                  <div className="p-4 grid gap-4 bg-black/20">
                    {roundMatches.map((match) => (
                      <div 
                        key={match.id} 
                        className={match.completed 
                          ? "relative border-2 border-green-500/50 bg-green-950/30 p-4 rounded-xl shadow-inner" 
                          : "relative border-2 border-white/5 bg-slate-800/50 p-4 rounded-xl hover:border-yellow-500/50 transition-all"}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button 
                            disabled={match.completed}
                            onClick={() => handleWin(match.id, match.player_1)}
                            className={"flex-1 p-3 rounded-lg font-bold text-lg " + (match.winner === match.player_1 ? "text-yellow-400" : "text-white")}
                          >
                            {match.player_1}
                          </button>
                          
                          <div className="text-slate-500 font-black italic px-2">VS</div>
                          
                          <button 
                            disabled={match.completed}
                            onClick={() => handleWin(match.id, match.player_2)}
                            className={"flex-1 p-3 rounded-lg font-bold text-lg " + (match.winner === match.player_2 ? "text-yellow-400" : "text-white")}
                          >
                            {match.player_2}
                          </button>
                        </div>
                        
                        {match.completed && (
                          <div className="text-center mt-2">
                            <span className="bg-yellow-500 text-black px-4 py-0.5 rounded-full text-xs font-black uppercase">
                              Result: {match.score}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))
            ) : (
              <Leaderboard matches={matches} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
