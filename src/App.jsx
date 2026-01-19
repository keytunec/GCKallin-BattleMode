import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// 1. Initialisierung - (Deine URL ist korrekt, ANON_KEY bitte prüfen!)
const supabase = createClient('https://dkjpcdaiftxkpldriuep.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRranBjZGFpZnR4a3BsZHJpdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjYyMjUsImV4cCI6MjA4NDQwMjIyNX0.4-bity8A3jHpjgq6aMyKZb6d_PpkciqSb97socqnJ8E ');
const TEAM_CODE = "Kallin2026";

export default function BattleArena() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: pData } = await supabase.from('players').select('*').order('name', { ascending: true });
    const { data: mData } = await supabase.from('matches').select('*').order('id', { ascending: true });
    setPlayers(pData || []);
    setMatches(mData || []);
    setLoading(false);
  }

  // Längere Konfetti-Animation
  const fireVictory = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleWin = async (matchId, winnerName) => {
    const code = prompt("Team-Code:");
    if (code !== TEAM_CODE) return alert("Falscher Code!");
    const score = prompt("Ergebnis (z.B. 3&2 oder AS):");
    if (!score) return;

    const isAS = score.toUpperCase() === 'AS';
    const { error } = await supabase.from('matches').update({ 
      winner: isAS ? null : winnerName, 
      score: score.toUpperCase(), 
      completed: true 
    }).eq('id', matchId);

    if (error) {
        alert("Fehler: " + error.message);
    } else {
        fireVictory();
        fetchData();
    }
  };

  // NEU: Funktion zum Zurücksetzen eines Matches
  const resetMatch = async (matchId) => {
    const code = prompt("Team-Code zum ZURÜCKSETZEN:");
    if (code !== TEAM_CODE) return;
    
    const { error } = await supabase.from('matches').update({ 
      winner: null, 
      score: null, 
      completed: false 
    }).eq('id', matchId);

    if (!error) fetchData();
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

  // BILD-PFAD: Nutzt jetzt die neue PNG Datei
  const bgUrl = "https://keytunec.github.io/GCKallin-BattleMode/Gemini_Generated_Image_mk0buymk0buymk0b.png";

  return (
    <div className="min-h-screen text-white font-sans relative bg-black">
      {/* Hintergrundbild */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url("${bgUrl}")` }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <header className="text-center py-12">
          <h1 className="text-6xl font-black italic uppercase text-yellow-500 drop-shadow-2xl">Kallin Arena</h1>
        </header>

        <nav className="flex justify-center gap-4 mb-10">
          <button onClick={() => setActiveTab('matches')} className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'matches' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800'}`}>Battles</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800'}`}>Tabelle</button>
        </nav>

        {loading ? (
          <div className="text-center py-20 text-yellow-500 font-black animate-pulse">LADE DATEN...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'matches' && rounds.map((rMatches, rIdx) => (
              <details key={rIdx} className="group bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <summary className="p-5 cursor-pointer flex justify-between items-center font-black uppercase text-yellow-500 group-open:bg-yellow-500 group-open:text-black transition-all">
                  Runde {rIdx + 1}
                  <span className="text-[10px] px-3 py-1 border border-current rounded-full italic">Öffnen</span>
                </summary>
                <div className="p-4 grid gap-3 bg-black/40 border-t border-white/5">
                  {rMatches.map(m => (
                    <div key={m.id} className={`relative p-4 rounded-xl border-2 flex items-center justify-between transition-all ${m.completed ? 'border-green-600/50 bg-green-900/20' : 'border-white/5 bg-slate-800/80'}`}>
                      <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_1)} className={`flex-1 font-bold text-center ${m.winner === m.player_1 ? 'text-yellow-400 text-2xl' : 'text-white'}`}>{m.player_1}</button>
                      <div className="px-2 text-[10px] text-slate-600 font-black italic">vs</div>
                      <button disabled={m.completed} onClick={() => handleWin(m.id, m.player_2)} className={`flex-1 font-bold text-center ${m.winner === m.player_2 ? 'text-yellow-400 text-2xl' : 'text-white'}`}>{m.player_2}</button>
                      
                      {m.completed && (
                        <button 
                          onClick={() => resetMatch(m.id)}
                          className="absolute -top-2 -right-2 bg-red-600 text-[8px] p-1 rounded-full hover:scale-110 transition"
                          title="Zurücksetzen"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}

            {activeTab === 'leaderboard' && (
              <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-yellow-500 text-black font-black uppercase text-[10px] tracking-widest border-b border-yellow-600">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4 text-center">Siege</th>
                      <th className="p-4 text-center">Halved</th>
                      <th className="p-4 text-center">Punkte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {calculateLeaderboard().map(([name, s]) => (
                      <tr key={name} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold italic tracking-tight">{name}</td>
                        <td className="p-4 text-center text-green-400 font-mono text-xl">{s.siege}</td>
                        <td className="p-4 text-center text-blue-400 font-mono text-xl">{s.halved}</td>
                        <td className="p-4 text-center text-yellow-500 font-black text-2xl">{s.punkte}</td>
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
