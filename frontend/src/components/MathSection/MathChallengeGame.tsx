import React, { useState, useEffect } from 'react';
import { Trophy, Target, Sparkles, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchGameChallenge, submitGameGuess } from '../../services/api';

interface MathChallengeGameProps {
  onGraphData: (data: any) => void;
}

export const MathChallengeGame: React.FC<MathChallengeGameProps> = ({ onGraphData }) => {
  const [currentLevel, setCurrentLevel] = useState<string>('1');
  const [challengeInfo, setChallengeInfo] = useState<any>(null);
  const [playerGuess, setPlayerGuess] = useState<string>('y = x');
  const [result, setResult] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const loadChallenge = async (levelId: string) => {
    try {
      const res = await fetchGameChallenge(levelId);
      setChallengeInfo(res.data.challenge);
      setResult(null);

      // Render target shape on canvas
      onGraphData({
        type: 'GAME_CHALLENGE',
        dimension: '2D',
        title: `Challenge: ${res.data.challenge.tier}`,
        metadata: {
          type: 'GAME_CHALLENGE',
          dimension: '2D',
          raw: 'Match the target shape!',
        },
        traces: [res.data.target_trace],
      });
    } catch (err) {
      console.error('Failed loading challenge:', err);
    }
  };

  useEffect(() => {
    loadChallenge(currentLevel);
  }, [currentLevel]);

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerGuess.trim()) return;

    setIsEvaluating(true);
    try {
      const res = await submitGameGuess(currentLevel, playerGuess);
      setResult(res.data);

      if (res.data.passed) {
        setScore((s) => s + 100);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Display both guess and target curve on canvas
      onGraphData({
        type: 'GAME_RESULT',
        dimension: '2D',
        title: `Accuracy: ${res.data.accuracy_score}%`,
        metadata: {
          type: 'GAME_RESULT',
          dimension: '2D',
          raw: playerGuess,
        },
        traces: [res.data.target_trace, res.data.player_trace],
      });
    } catch (err) {
      console.error('Guess evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl border border-amber-900/60 space-y-4 animate-in fade-in duration-200 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/40 pb-3.5">
        <div>
          <h2 className="text-base font-extrabold text-amber-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Inverse Graphing Challenge: "Guess the Equation"</span>
          </h2>
          <p className="text-[11px] text-amber-300/80">
            Analyze the yellow target curve and write the matching mathematical formula!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-800/60 text-xs font-bold text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Score: {score} XP</span>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            {['1', '2', '3', '4'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setCurrentLevel(lvl)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                  currentLevel === lvl
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lvl {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge Hint */}
      {challengeInfo && (
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">{challengeInfo.tier}</div>
              <div className="text-[11px] text-slate-400">{challengeInfo.description}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadChallenge(currentLevel)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            title="Reset Target Curve"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guess Input Form */}
      <form onSubmit={handleSubmitGuess} className="flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={playerGuess}
          onChange={(e) => setPlayerGuess(e.target.value)}
          placeholder="e.g. y = 2*x - 3"
          className="flex-1 w-full bg-[#050811] text-amber-200 font-mono text-sm px-4 py-2.5 rounded-xl border border-amber-900/50 focus:border-amber-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isEvaluating || !playerGuess.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wide bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          {isEvaluating ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="w-4 h-4 text-slate-950" />
          )}
          <span>Test Guess</span>
        </button>
      </form>

      {/* Result feedback */}
      {result && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between animate-in slide-in-from-bottom duration-200 ${
            result.passed
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {result.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold">
                {result.passed ? '🎉 Target Matched Perfectly!' : 'Almost there! Keep tweaking your equation.'}
              </div>
              <div className="text-[11px] opacity-80 font-mono">
                Accuracy: {result.accuracy_score}% (MAE: {result.mae})
              </div>
            </div>
          </div>

          {result.passed && parseInt(currentLevel) < 4 && (
            <button
              type="button"
              onClick={() => setCurrentLevel((l) => (parseInt(l) + 1).toString())}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-sm"
            >
              <span>Next Level</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
