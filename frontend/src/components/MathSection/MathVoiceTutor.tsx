import { ChevronDown, ChevronUp, Cpu, RefreshCw, Volume2, VolumeX } from "lucide-react";
import React, { useEffect, useState } from "react";
import { fetchStepByStepDerivation } from "../../services/api";

interface MathVoiceTutorProps {
    equation: string;
}

export const MathVoiceTutor: React.FC<MathVoiceTutorProps> = ({ equation }) => {
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [derivationData, setDerivationData] = useState<any>(null);

    const loadDerivations = async () => {
        if (!equation.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetchStepByStepDerivation(equation);
            if (res?.data) {
                setDerivationData(res.data);
            }
        } catch (err) {
            console.error("Failed to compute step-by-step calculus:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !derivationData) {
            loadDerivations();
        }
    }, [isOpen, equation]);

    // Clean up speech synthesis on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleToggleSpeech = () => {
        if (!window.speechSynthesis) {
            alert("Speech synthesis is not supported on this browser.");
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const script = derivationData?.voice_tutor_script || `Analyzing equation ${equation}.`;
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="glass-card rounded-2xl border border-sky-800/40 bg-gradient-to-br from-[#040e1f]/90 via-[#030914]/90 to-[#0c0419]/90 overflow-hidden shadow-xl shadow-sky-950/20">
            {/* Accordion Toggle Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-700/60 text-sky-400">
                        <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-sky-200 flex items-center gap-2">
                            <span>AI Voice Math Tutor & Step-by-Step Calculus</span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                                Live Speech
                            </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Listen to audio analysis and view formal analytical derivations
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Quick Voice Play/Pause Button */}
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            if (!derivationData) {
                                loadDerivations().then(() => handleToggleSpeech());
                            } else {
                                handleToggleSpeech();
                            }
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isSpeaking
                                ? "bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse"
                                : "bg-sky-950/80 border-sky-700 text-sky-300 hover:bg-sky-900"
                        }`}
                        title={isSpeaking ? "Stop Voice Tutor" : "Listen to AI Voice Tutor"}
                    >
                        {isSpeaking ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                            <Volume2 className="w-4 h-4 text-sky-400" />
                        )}
                        <span className="hidden sm:inline">{isSpeaking ? "Stop Voice" : "Play Voice Tutor"}</span>
                    </button>

                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Expanded Derivation Body */}
            {isOpen && (
                <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80">
                    {isLoading ? (
                        <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                            <span>Computing step-by-step calculus derivations...</span>
                        </div>
                    ) : derivationData ? (
                        <div className="space-y-3 pt-3">
                            {/* Spoken Commentary Box */}
                            <div className="p-3 bg-sky-950/40 rounded-xl border border-sky-900/60 text-xs text-sky-200 italic">
                                "{derivationData.voice_tutor_script}"
                            </div>

                            {/* Analytical Breakdown Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                {/* First Derivative */}
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
                                        First Derivative (d/dx):
                                    </span>
                                    <div className="font-mono text-slate-100 bg-[#050811] p-2 rounded-lg border border-slate-800 overflow-x-auto">
                                        f'(x) = {derivationData.first_derivative}
                                    </div>
                                </div>

                                {/* Second Derivative */}
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">
                                        Second Derivative (d²f/dx²):
                                    </span>
                                    <div className="font-mono text-slate-100 bg-[#050811] p-2 rounded-lg border border-slate-800 overflow-x-auto">
                                        f''(x) = {derivationData.second_derivative}
                                    </div>
                                </div>

                                {/* Indefinite Integral */}
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                                        Indefinite Integral (∫ f(x) dx):
                                    </span>
                                    <div className="font-mono text-slate-100 bg-[#050811] p-2 rounded-lg border border-slate-800 overflow-x-auto">
                                        {derivationData.integral}
                                    </div>
                                </div>

                                {/* Critical Stationary Points */}
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                                        Critical Stationary Extrema (f'(x) = 0):
                                    </span>
                                    <div className="font-mono text-slate-100 bg-[#050811] p-2 rounded-lg border border-slate-800">
                                        {derivationData.critical_points?.length > 0
                                            ? `x ∈ { ${derivationData.critical_points.join(", ")} }`
                                            : "No simple real critical points found"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                            Click refresh to generate step-by-step analytical breakdown
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
