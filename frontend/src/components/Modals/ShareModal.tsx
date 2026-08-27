import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Mail,
  Send,
  Download,
  Image as ImageIcon,
  ExternalLink,
  MessageSquare,
  Globe,
  Sparkles,
  Link2,
} from 'lucide-react';
import Plotly from 'plotly.js-dist-min';
import { encodeShareableUrl } from '../../utils/shareableState';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  mathData: any;
  nlpData: any;
  currentEquation: string;
  currentText: string;
  mode: 'equation' | 'nlp';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  mathData,
  nlpData,
  currentEquation,
  currentText,
  mode,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [customCaption, setCustomCaption] = useState<string>(
    'Check out this interactive scientific visualization I generated on Graphxyz Studio!'
  );
  const [customDomain, setCustomDomain] = useState<string>('');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Generate shareable URL
  const generateLiveLink = (): string => {
    const rawLink = encodeShareableUrl({
      mode,
      equation: currentEquation,
      dimension: mathData?.dimension || 'AUTO',
      text: currentText,
    });

    if (customDomain.trim()) {
      try {
        const hash = rawLink.split('#')[1] || '';
        const base = customDomain.trim().replace(/\/$/, '');
        return `${base}/#${hash}`;
      } catch {
        return rawLink;
      }
    }
    return rawLink;
  };

  // Capture canvas snapshot image on modal open
  useEffect(() => {
    if (!isOpen) return;

    const captureGraph = async () => {
      const plotEl = document.querySelector('.js-plotly-plot') as any;
      if (!plotEl) return;

      setIsCapturing(true);
      try {
        const dataUrl = await Plotly.toImage(plotEl, {
          format: 'png',
          width: 1000,
          height: 600,
          scale: 2,
        });
        setSnapshotUrl(dataUrl);
      } catch (err) {
        console.warn('Could not capture graph snapshot:', err);
      } finally {
        setIsCapturing(false);
      }
    };

    captureGraph();
  }, [isOpen, mode, mathData, nlpData]);

  if (!isOpen) return null;

  const liveLink = generateLiveLink();
  const title = mode === 'equation' ? `Equation Graph: ${currentEquation}` : `AI Text-to-Graph: ${currentText.slice(0, 40)}...`;
  const subject = `Scientific Graph: ${mode === 'equation' ? currentEquation : 'AI Text Visualization'}`;

  // Formatted multi-line text message
  const fullFormattedMessage = `🌌 *Graphxyz Scientific Visualization*
📐 *${mode === 'equation' ? 'Equation' : 'Text Concept'}:* ${mode === 'equation' ? currentEquation : currentText.slice(0, 60)}
📊 *Dimension:* ${mathData?.dimension || '3D'}
💬 *Message:* ${customCaption}

🚀 *Open Live Interactive Graph:*
${liveLink}`;

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullFormattedMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Email Share Handler
  const handleShareEmail = () => {
    const body = `${customCaption}

${mode === 'equation' ? `Equation: ${currentEquation}` : `Text: ${currentText}`}
Dimension: ${mathData?.dimension || '3D'}

Open the live interactive graph in your browser:
${liveLink}

Generated with Graphxyz Studio (https://github.com/OVSSVARUN-2007/graphxyz)`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // Twitter / X Share Handler
  const handleShareTwitter = () => {
    const tweetText = `🌌 Check out this graph for ${mode === 'equation' ? currentEquation : 'my text'} on Graphxyz Studio!\n\n${customCaption}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(liveLink)}&hashtags=Mathematics,DataViz,Graphxyz,Science`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Telegram Share Handler
  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(liveLink)}&text=${encodeURIComponent(fullFormattedMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // LinkedIn Share Handler
  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(liveLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Reddit Share Handler
  const handleShareReddit = () => {
    const redditTitle = `Interactive Graph: ${mode === 'equation' ? currentEquation : 'AI Text Manifold'} on Graphxyz`;
    const url = `https://reddit.com/submit?url=${encodeURIComponent(liveLink)}&title=${encodeURIComponent(redditTitle)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy Formatted Text to Clipboard
  const handleCopyFormattedText = () => {
    navigator.clipboard.writeText(fullFormattedMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Copy Direct Link to Clipboard
  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(liveLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Copy Snapshot Image to Clipboard
  const handleCopyImage = async () => {
    if (!snapshotUrl) return;
    try {
      const res = await fetch(snapshotUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.warn('Clipboard image write not supported:', err);
      // Fallback: download
      handleDownloadSnapshot();
    }
  };

  // Download Snapshot Image
  const handleDownloadSnapshot = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `graphxyz_${mode}_share_card.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b1120] border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Share Graph & Equation</h3>
              <p className="text-[11px] text-slate-400">Share live interactive links, snapshots, and captions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Live Preview Card */}
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Preview Share Card:</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                {mathData?.dimension || '3D'} Manifold
              </span>
            </div>

            {/* Graph Snapshot Thumbnail */}
            {snapshotUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={snapshotUrl}
                  alt="Graph Preview"
                  className="w-full h-36 object-contain"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-300">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className="hover:text-cyan-400 flex items-center gap-1"
                    title="Copy snapshot image to clipboard"
                  >
                    {copiedImage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedImage ? 'Copied' : 'Copy Image'}</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleDownloadSnapshot}
                    className="hover:text-cyan-400 flex items-center gap-1"
                    title="Download snapshot image"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-28 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                {isCapturing ? 'Generating card snapshot...' : 'No graph rendered yet'}
              </div>
            )}

            {/* Equation / Prompt preview */}
            <div className="text-xs text-cyan-300 font-mono font-bold bg-[#050811] p-2.5 rounded-lg border border-slate-800">
              {mode === 'equation' ? currentEquation : currentText.slice(0, 100) + '...'}
            </div>
          </div>

          {/* Custom Message / Caption Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Custom Caption / Message:</span>
            </label>
            <input
              type="text"
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Add your note or explanation..."
              className="w-full bg-[#050811] text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Custom Deployed URL Override (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Deployed Link Base (Optional):</span>
              </span>
              <span className="text-[10px] text-slate-500">Auto-detects live domain</span>
            </div>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. https://graphxyz.vercel.app (defaults to current origin)"
              className="w-full bg-[#050811] text-slate-300 font-mono text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Social Media 1-Click Channels */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Share to Channels:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/60 text-sky-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Email</span>
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={handleShareTwitter}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-slate-300" />
                <span>Twitter / X</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="p-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <Send className="w-4 h-4 text-blue-400" />
                <span>Telegram</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>LinkedIn</span>
              </button>

              {/* Reddit */}
              <button
                type="button"
                onClick={handleShareReddit}
                className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-rose-400" />
                <span>Reddit</span>
              </button>
            </div>
          </div>

          {/* Quick Copy Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {/* Copy Live Link */}
            <button
              type="button"
              onClick={handleCopyDirectLink}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Copy Live Interactive Link</span>
              </div>
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Copy Full Message + Link */}
            <button
              type="button"
              onClick={handleCopyFormattedText}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-purple-400" />
                <span>Copy Full Message & Link</span>
              </div>
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
