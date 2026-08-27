import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, Sparkles, Volume2, AlertCircle, RefreshCw } from 'lucide-react';

interface VoiceMathInputProps {
  onEquationTranscribed: (equation: string) => void;
}

export const VoiceMathInput: React.FC<VoiceMathInputProps> = ({ onEquationTranscribed }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [convertedMath, setConvertedMath] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);

  // Advanced natural speech to LaTeX / mathematical formula translator
  const spokenToMath = (text: string): string => {
    let clean = text.toLowerCase().trim();

    const replacements: [RegExp, string][] = [
      // Powers & exponents
      [/squared|square/g, '^2'],
      [/cubed|cube/g, '^3'],
      [/to the power of (\w+)|to the power (\w+)|power of (\w+)|power (\w+)/g, '^$1$2$3$4'],
      [/raised to (\w+)|raise to (\w+)/g, '^$1$2'],
      [/e to the (\w+)|e power (\w+)/g, 'e^($1$2)'],
      
      // Operators
      [/plus/g, '+'],
      [/minus|negative/g, '-'],
      [/times|multiplied by|multiply by|into/g, '*'],
      [/divided by|divide by|over/g, '/'],
      [/equals|equal to|is equal to/g, '='],
      
      // Trigonometric & Standard Functions
      [/sine of|sin of|sine|sin/g, '\\sin'],
      [/cosine of|cos of|cosine|cos/g, '\\cos'],
      [/tangent of|tan of|tangent|tan/g, '\\tan'],
      [/secant of|sec of|secant/g, '\\sec'],
      [/cosecant of|csc of|cosecant/g, '\\csc'],
      [/cotangent of|cot of|cotangent/g, '\\cot'],
      [/square root of|sqrt of|square root|sqrt/g, '\\sqrt'],
      [/log of|logarithm of|log/g, '\\log'],
      [/natural log of|ln of|ln/g, '\\ln'],
      [/absolute value of|absolute of|abs of/g, '\\abs'],
      
      // Constants & Greek
      [/pi/g, '\\pi'],
      [/theta/g, '\\theta'],
      [/phi/g, '\\phi'],
      [/euler's number|euler number/g, 'e'],
      [/infinity/g, '\\infty'],
      
      // Numbers & Fractions
      [/one half|half/g, '0.5'],
      [/one third/g, '(1/3)'],
      [/one fourth|one quarter/g, '0.25'],
      [/zero/g, '0'],
      [/one/g, '1'],
      [/two/g, '2'],
      [/three/g, '3'],
      [/four/g, '4'],
      [/five/g, '5'],
      [/six/g, '6'],
      [/seven/g, '7'],
      [/eight/g, '8'],
      [/nine/g, '9'],
      [/ten/g, '10'],
      
      // Syntax & Brackets
      [/open bracket|open parenthesis|left parenthesis/g, '('],
      [/close bracket|close parenthesis|right parenthesis/g, ')'],
    ];

    replacements.forEach(([regex, replacement]) => {
      clean = clean.replace(regex, replacement);
    });

    // Clean up spaces around operators
    clean = clean
      .replace(/\s*\+\s*/g, ' + ')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/\s*\*\s*/g, ' * ')
      .replace(/\s*\/\s*/g, ' / ')
      .replace(/\s*=\s*/g, ' = ')
      .replace(/\\sin\s*\(/g, '\\sin(')
      .replace(/\\cos\s*\(/g, '\\cos(')
      .replace(/\\tan\s*\(/g, '\\tan(')
      .replace(/\\sqrt\s*\(/g, '\\sqrt(');

    // Auto prepend dependent variable if missing
    if (!clean.includes('=')) {
      if (clean.includes('x') && clean.includes('y')) {
        clean = `z = ${clean}`;
      } else if (clean.includes('x')) {
        clean = `y = ${clean}`;
      }
    }

    return clean.replace(/\s+/g, ' ').trim();
  };

  const sampleVoicePrompts = [
    'sine of x times cosine of y',
    'x squared plus y squared',
    'x cubed minus 3 times x plus 1',
    'e to the negative 0.5 times x squared',
  ];

  const handleSimulateVoice = (phrase: string) => {
    setTranscript(phrase);
    setErrorMessage(null);
    const math = spokenToMath(phrase);
    setConvertedMath(math);
  };

  const startSpeechRecognition = async () => {
    setErrorMessage(null);

    // Check speech recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Web Speech API is not supported on this browser. Try Google Chrome or use the Quick Voice Dictation presets below.'
      );
      return;
    }

    try {
      // Request mic permission explicitly
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      console.warn('Mic permission error:', err);
      setErrorMessage('Microphone access denied. Please allow microphone permissions in your browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening... Speak your mathematical formula now');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        const math = spokenToMath(currentTranscript);
        setConvertedMath(math);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone permission blocked. Please enable microphone permissions.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please speak clearly into your microphone.');
        } else {
          setErrorMessage(`Speech recognition error (${event.error}). Try again or use presets.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMessage('Could not initiate speech engine. Please try clicking again.');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleApply = () => {
    if (convertedMath) {
      onEquationTranscribed(convertedMath);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-purple-800/40 bg-gradient-to-br from-[#0e061d]/90 via-[#070312]/90 to-[#16041a]/90 space-y-3 shadow-xl shadow-purple-950/20">
      {/* Header & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-purple-950/80 border-purple-700/60 text-purple-400'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-purple-200 flex items-center gap-2">
              <span>Voice-to-Math Dictation Studio</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-bold">
                Speech AI
              </span>
            </h4>
            <p className="text-[11px] text-purple-300/70">
              Speak formulas naturally to auto-convert speech into mathematical equations
            </p>
          </div>
        </div>

        {/* Start / Stop Record Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 animate-pulse'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
          }`}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{isListening ? 'Stop Listening' : 'Start Voice Dictation'}</span>
        </button>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-[11px] text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Transcript & Parsed Formula */}
      <div className="p-3 bg-[#050811] rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-semibold">Spoken Audio:</span>
          {isListening && (
            <span className="text-rose-400 flex items-center gap-1 font-mono font-bold animate-pulse">
              ● Recording Audio
            </span>
          )}
        </div>

        <div className="text-xs text-purple-200 font-medium italic min-h-[20px]">
          {transcript ? `"${transcript}"` : <span className="text-slate-600">No speech recorded yet. Click 'Start Voice Dictation' or select a preset below.</span>}
        </div>

        {convertedMath && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Parsed Equation:</span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-cyan-800/50 inline-block">
                {convertedMath}
              </span>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Equation</span>
            </button>
          </div>
        )}
      </div>

      {/* Voice Dictation Presets (Instant click-to-dictate test) */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-slate-400 font-bold block">Quick Voice Test Phrases:</span>
        <div className="flex flex-wrap gap-1.5">
          {sampleVoicePrompts.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSimulateVoice(phrase)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-700/60 text-[11px] text-slate-300 hover:text-purple-200 transition-all font-mono"
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
