import { Check, Mic, MicOff } from "lucide-react";
import React, { useEffect, useState } from "react";

interface VoiceMathInputProps {
    onEquationTranscribed: (equation: string) => void;
}

export const VoiceMathInput: React.FC<VoiceMathInputProps> = ({ onEquationTranscribed }) => {
    const [isListening, setIsListening] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>("");
    const [convertedMath, setConvertedMath] = useState<string>("");
    const [isSupported, setIsSupported] = useState<boolean>(true);

    // Translate spoken English math phrases into mathematical expressions
    const spokenToMath = (text: string): string => {
        let clean = text.toLowerCase();

        const replacements: [RegExp, string][] = [
            [/squared/g, "^2"],
            [/cubed/g, "^3"],
            [/to the power of (\w+)/g, "^$1"],
            [/raised to (\w+)/g, "^$1"],
            [/plus/g, "+"],
            [/minus/g, "-"],
            [/times|multiplied by/g, "*"],
            [/divided by|over/g, "/"],
            [/sine of|sin of|sine/g, "\\sin"],
            [/cosine of|cos of|cosine/g, "\\cos"],
            [/tangent of|tan of|tangent/g, "\\tan"],
            [/square root of|sqrt of/g, "\\sqrt"],
            [/pi/g, "\\pi"],
            [/euler's number|euler number/g, "e"],
            [/equals|is equal to/g, "="],
            [/e to the (\w+)/g, "e^($1)"],
            [/one half/g, "0.5"],
            [/one third/g, "(1/3)"],
        ];

        replacements.forEach(([regex, replacement]) => {
            clean = clean.replace(regex, replacement);
        });

        // If starts without z = or y = and has x and y
        if (!clean.includes("=")) {
            if (clean.includes("y") && clean.includes("x")) {
                clean = `z = ${clean}`;
            } else if (clean.includes("x")) {
                clean = `y = ${clean}`;
            }
        }

        return clean.replace(/\s+/g, " ").trim();
    };

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
        }
    }, []);

    const toggleListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript("Listening for math equation...");
        };

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);
            const math = spokenToMath(text);
            setConvertedMath(math);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleApply = () => {
        if (convertedMath) {
            onEquationTranscribed(convertedMath);
        }
    };

    if (!isSupported) return null;

    return (
        <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
                        isListening
                            ? "bg-rose-500 text-white animate-pulse shadow-rose-500/50"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                    }`}
                    title="Click to dictate mathematical equations with your voice"
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isListening ? "Stop Listening" : "Voice Dictate"}</span>
                </button>

                <div>
                    <div className="text-slate-300 font-medium">
                        {transcript ? (
                            <span className="text-purple-300 italic">"{transcript}"</span>
                        ) : (
                            <span>
                                Say:{" "}
                                <span className="text-purple-300 font-mono">"sine of x squared times cosine of y"</span>
                            </span>
                        )}
                    </div>
                    {convertedMath && (
                        <div className="text-[11px] text-cyan-300 font-mono font-bold mt-0.5">
                            Parsed: {convertedMath}
                        </div>
                    )}
                </div>
            </div>

            {convertedMath && (
                <button
                    type="button"
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-sm active:scale-95 transition-all self-end sm:self-auto"
                >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Canvas</span>
                </button>
            )}
        </div>
    );
};
