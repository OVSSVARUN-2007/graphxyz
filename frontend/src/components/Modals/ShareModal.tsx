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
  Smartphone,
  Info,
} from 'lucide-react';
import Plotly from 'plotly.js-dist-min';
import { encodeShareableUrl } from '../../utils/shareableState';
import { uploadSnapshot } from '../../services/api';

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
  const [pasteNotice, setPasteNotice] = useState<boolean>(false);
  const [canNativeShareFiles, setCanNativeShareFiles] = useState<boolean>(false);
  const [customCaption, setCustomCaption] = useState<string>(
    'Check out this interactive scientific visualization I generated on Graphxyz Studio!'
  );
  const [customDomain, setCustomDomain] = useState<string>('');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null);
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

  // Generate full image URL
  const generatePublicImageUrl = (relativePath: string): string => {
    if (customDomain.trim()) {
      const base = customDomain.trim().replace(/\/$/, '');
      return `${base}${relativePath}`;
    }
    return `${window.location.origin}${relativePath}`;
  };

  // Capture canvas snapshot image & upload public preview token
  useEffect(() => {
    if (!isOpen) return;

    const captureGraph = async () => {
      const plotEl = document.querySelector('.js-plotly-plot') as any;
      if (!plotEl) return;

      setIsCapturing(true);
      try {
        const dataUrl = await Plotly.toImage(plotEl, {
          format: 'png',
          width: 1200,
          height: 700,
          scale: 2,
        });
        setSnapshotUrl(dataUrl);

        // Upload to snapshot host for direct image URL previews
        try {
          const res = await uploadSnapshot(dataUrl);
          if (res?.image_url) {
            setPublicImageUrl(generatePublicImageUrl(res.image_url));
          }
        } catch (e) {
          console.warn('Snapshot cloud upload fallback:', e);
        }

        // Check if Web Share API with Files is supported
        if (navigator.canShare) {
          try {
            const blobRes = await fetch(dataUrl);
            const blob = await blobRes.blob();
            const testFile = new File([blob], 'graphxyz.png', { type: 'image/png' });
            if (navigator.canShare({ files: [testFile] })) {
              setCanNativeShareFiles(true);
            }
          } catch {
            setCanNativeShareFiles(false);
          }
        }
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

  // Formatted multi-line text message with image link + live link
  const fullFormattedMessage = `🌌 *Graphxyz Scientific Visualization*
📐 *${mode === 'equation' ? 'Equation' : 'Text Concept'}:* ${mode === 'equation' ? currentEquation : currentText.slice(0, 60)}
📊 *Dimension:* ${mathData?.dimension || '3D'}
💬 *Message:* ${customCaption}
${publicImageUrl ? `\n📸 *Graph Image Snapshot:*\n${publicImageUrl}\n` : ''}
🚀 *Open Live Interactive Graph:*
${liveLink}`;

  // Native Web Share API with attached PNG file (Mobile & Supported Browsers)
  const handleNativeShare = async () => {
    if (!snapshotUrl) return;
    try {
      const res = await fetch(snapshotUrl);
      const blob = await res.blob();
      const file = new File([blob], 'graphxyz_visualization.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text: fullFormattedMessage,
          url: liveLink,
          files: [file],
        });
        return;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share error:', err);
      }
    }

    // Fallback if native file share cancelled/failed: copy image
    handleCopyImage();
  };

  // WhatsApp Share Handler with automatic image clipboard copy
  const handleShareWhatsApp = async () => {
    // Automatically copy image to clipboard so user can press Ctrl+V directly in chat
    await handleCopyImageSilent();
    setPasteNotice(true);
    setTimeout(() => setPasteNotice(false), 6000);

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullFormattedMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Email Share Handler
  const handleShareEmail = async () => {
    await handleCopyImageSilent();
    const body = `${customCaption}

${mode === 'equation' ? `Equation: ${currentEquation}` : `Text: ${currentText}`}
Dimension: ${mathData?.dimension || '3D'}
${publicImageUrl ? `Image Snapshot: ${publicImageUrl}` : ''}

Open the live interactive graph:
${liveLink}

(Tip: Graph snapshot image was copied to clipboard, you can press Ctrl+V / Paste directly into this email body)`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // Twitter / X Share Handler
  const handleShareTwitter = () => {
    const tweetText = `🌌 Graphxyz Studio: ${mode === 'equation' ? currentEquation : 'AI Text-to-Graph'}\n\n${customCaption}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(liveLink)}&hashtags=Mathematics,DataViz,Graphxyz,Science`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Telegram Share Handler
  const handleShareTelegram = async () => {
    await handleCopyImageSilent();
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

  // Copy Snapshot Image to Clipboard (Interactive)
  const handleCopyImage = async () => {
    if (!snapshotUrl) return;
    try {
      const res = await fetch(snapshotUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopiedImage(true);
      setPasteNotice(true);
      setTimeout(() => setCopiedImage(false), 2500);
      setTimeout(() => setPasteNotice(false), 5000);
    } catch (err) {
      console.warn('Clipboard image write not supported:', err);
      handleDownloadSnapshot();
    }
  };

  // Copy Snapshot Image Silently
  const handleCopyImageSilent = async () => {
    if (!snapshotUrl) return;
    try {
      const res = await fetch(snapshotUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch {
      // Ignore if silent
    }
  };

  // Download Snapshot Image
  const handleDownloadSnapshot = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `graphxyz_${mode}_card.png`;
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
              <p className="text-[11px] text-slate-400">Share live interactive links, image cards, and captions</p>
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
          {/* Paste Helper Banner (Appears when WhatsApp/Email/Copy Image is clicked) */}
          {pasteNotice && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-700/80 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in slide-in-from-top duration-200 shadow-lg">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <b>Graph image copied to clipboard!</b> Simply press <kbd className="px-1.5 py-0.5 bg-emerald-900 rounded font-mono text-[10px]">Ctrl + V</kbd> or right-click <b>Paste</b> in WhatsApp/Email to attach the image.
              </div>
            </div>
          )}

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
                    className="hover:text-cyan-400 flex items-center gap-1 font-bold"
                    title="Copy snapshot image to clipboard"
                  >
                    {copiedImage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleDownloadSnapshot}
                    className="hover:text-cyan-400 flex items-center gap-1"
                    title="Download snapshot image"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PNG</span>
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

          {/* Primary Action: Direct Mobile / Native App File Share */}
          {canNativeShareFiles && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
            >
              <Smartphone className="w-4 h-4 text-slate-950" />
              <span>Share Image + Link Directly (WhatsApp, AirDrop, Messages)</span>
            </button>
          )}

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
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Share to Apps & Channels:</span>
              <span className="text-[10px] text-cyan-400 font-normal">Auto-copies image for instant paste</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group"
              >
                <Send className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>WhatsApp</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/60 text-sky-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group"
              >
                <Mail className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Email</span>
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={handleShareTwitter}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group"
              >
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
                <span>Twitter / X</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="p-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group"
              >
                <Send className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Telegram</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>LinkedIn</span>
              </button>

              {/* Reddit */}
              <button
                type="button"
                onClick={handleShareReddit}
                className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group"
              >
                <ExternalLink className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Reddit</span>
              </button>
            </div>
          </div>

          {/* Quick Copy Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {/* Copy Image Button */}
            <button
              type="button"
              onClick={handleCopyImage}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Copy Graph Image</span>
              </div>
              {copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Copy Full Message + Image Link + App Link */}
            <button
              type="button"
              onClick={handleCopyFormattedText}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-purple-400" />
                <span>Copy Full Text & Links</span>
              </div>
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
