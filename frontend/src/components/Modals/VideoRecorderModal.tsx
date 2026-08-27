import { Download, Film, Play, RefreshCw, Video, X } from "lucide-react";
import Plotly from "plotly.js-dist-min";
import React, { useState } from "react";

interface VideoRecorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    mathData: any;
}

export const VideoRecorderModal: React.FC<VideoRecorderModalProps> = ({ isOpen, onClose, mathData }) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleRecordTurntable = async () => {
        const plotEl = document.querySelector(".js-plotly-plot") as any;
        if (!plotEl) {
            alert("No active 3D plot element found to record.");
            return;
        }

        setIsRecording(true);
        setProgress(0);
        setRecordedVideoUrl(null);

        try {
            // Find the WebGL canvas
            const canvas = plotEl.querySelector("canvas") as HTMLCanvasElement;
            if (!canvas) {
                throw new Error("Canvas element not found");
            }

            const stream = canvas.captureStream(60);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
                    ? "video/webm;codecs=vp9"
                    : "video/webm",
                videoBitsPerSecond: 5000000,
            });

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                setRecordedVideoUrl(url);
                setIsRecording(false);
            };

            mediaRecorder.start();

            // Spin the 3D camera 360 degrees over 5 seconds (100 steps)
            const totalSteps = 90;
            const radius = 2.2;
            const zHeight = 1.3;

            for (let step = 0; step < totalSteps; step++) {
                const theta = (step / totalSteps) * 2 * Math.PI;
                const eye = {
                    x: radius * Math.cos(theta),
                    y: radius * Math.sin(theta),
                    z: zHeight,
                };

                Plotly.relayout(plotEl, {
                    "scene.camera.eye": eye,
                });

                setProgress(Math.round(((step + 1) / totalSteps) * 100));
                await new Promise(r => setTimeout(r, 45));
            }

            mediaRecorder.stop();
        } catch (err) {
            console.error("Video recording failed:", err);
            setIsRecording(false);
            alert("Could not record video directly from WebGL canvas on this browser.");
        }
    };

    const handleDownloadVideo = () => {
        if (!recordedVideoUrl) return;
        const a = document.createElement("a");
        a.href = recordedVideoUrl;
        a.download = `graphxyz_360_turntable.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-[#0b1120] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-100">360° Cinematic Video Studio</h3>
                            <p className="text-[11px] text-slate-400">
                                Record smooth 60 FPS rotating camera animations
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto">
                    {/* Status / Preview */}
                    {recordedVideoUrl ? (
                        <div className="space-y-3">
                            <video
                                src={recordedVideoUrl}
                                controls
                                autoPlay
                                loop
                                className="w-full rounded-xl border border-slate-800 bg-black aspect-video object-contain"
                            />
                            <button
                                type="button"
                                onClick={handleDownloadVideo}
                                className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                            >
                                <Download className="w-4 h-4 fill-slate-950" />
                                <span>Download High-Definition Video (.WEBM / MP4)</span>
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center mx-auto text-purple-400">
                                <Film className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-purple-200">60 FPS 360° Turntable Capture</h4>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                                    Spins the 3D camera smoothly around your graph and packages it into an HD video
                                    clip.
                                </p>
                            </div>

                            {isRecording && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs text-purple-300">
                                        <span>Recording frames...</span>
                                        <span className="font-mono font-bold">{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Record Button */}
                    {!recordedVideoUrl && (
                        <button
                            type="button"
                            disabled={isRecording}
                            onClick={handleRecordTurntable}
                            className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isRecording ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Capturing 360° Animation ({progress}%)...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-white" />
                                    <span>Start 360° Video Recording</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
