import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Terminal,
  ExternalLink,
  X,
  ShieldCheck,
  Copy,
  Check,
  QrCode,
  Layers,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Globe,
  Settings,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { sounds } from '../utils/audio';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'instant' | 'pwabuilder' | 'cli' | 'capacitor' | 'distribution';

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<GuideTab>('instant');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-rmhlamusjgi34ginggaupo-993882630381.asia-southeast1.run.app';

  const manifestUrl = `${currentUrl}/manifest.json`;
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=0f172a&color=10b981&qzone=1`;

  const bubblewrapCmd = `npm install -g @bubblewrap/cli
npx @bubblewrap/cli init --manifest=${manifestUrl}
npx @bubblewrap/cli build`;

  const capacitorCmd = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Small Casino" com.smallcasino.app --web-dir dist
npm run build
npx cap add android
npx cap copy
npx cap open android`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    sounds.playChip();
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Android APK Package &amp; Download Center</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                  v3.0 Standalone
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete guide to convert, generate, and distribute Small Casino as a native Android APK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('instant')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'instant'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Phone Install</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwabuilder')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pwabuilder'
                ? 'border-blue-400 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>PWABuilder (.APK Maker)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cli'
                ? 'border-purple-400 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Google Bubblewrap CLI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capacitor')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'capacitor'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Capacitor / Android Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('distribution')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'distribution'
                ? 'border-teal-400 text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>How to Host &amp; Share APK</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-6 text-xs text-slate-300">
          {/* TAB 1: INSTANT PHONE INSTALL */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                      ★
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Direct WebAPK Install (No Computer or APK compilation required)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    Instant
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  When you open Small Casino in Google Chrome or Brave on Android, Android's built-in{' '}
                  <strong className="text-white">WebAPK minting service</strong> automatically compiles a
                  native APK on your phone and installs it with an app launcher icon, standalone fullscreen mode, and hardware acceleration!
                </p>

                {isInstallable ? (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install "Small Casino" Directly on this Phone</span>
                  </button>
                ) : isInstalled ? (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold">Small Casino is already installed on your device launcher!</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="text-amber-300 font-bold">How to Install from Android Browser:</div>
                    <div>1. Open Chrome or Brave on your phone.</div>
                    <div>
                      2. Tap the <strong className="text-white">three dots menu (⋮)</strong> at top right.
                    </div>
                    <div>
                      3. Tap <strong className="text-emerald-400">"Install app"</strong> or{' '}
                      <strong className="text-emerald-400">"Add to Home screen"</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code Scan Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-2 rounded-2xl bg-slate-900 border border-emerald-500/40 shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Scan to open Small Casino on mobile"
                    className="w-36 h-36 rounded-xl"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>Scan with Any Android Phone Camera</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Point your mobile phone camera or Google Lens at this QR code to immediately launch the
                    app on your phone and trigger the native install dialog.
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-slate-500 break-all">{currentUrl}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWABUILDER */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-white">PWABuilder by Microsoft &amp; Google (Recommended)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                    Free &amp; Official
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  PWABuilder is the industry standard for turning PWAs into standalone{' '}
                  <strong className="text-white">.apk</strong> and{' '}
                  <strong className="text-white">.aab</strong> files ready for sideloading or Google Play Store publication.
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold">Step 1: Your App URL</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300 font-mono text-[11px] truncate">{currentUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentUrl, 'pwa-url')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedCmd === 'pwa-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px] text-slate-300">
                  <div className="font-bold text-blue-400">Step 2: 3-Click Generation Process</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                    <li>Click the blue button below to open PWABuilder with your pre-loaded URL.</li>
                    <li>Click <strong className="text-white">"Package for Stores"</strong> in the top right.</li>
                    <li>
                      Select <strong className="text-emerald-400">Android</strong> and click{' '}
                      <strong className="text-emerald-400">"Generate"</strong>.
                    </li>
                    <li>
                      PWABuilder compiles a signed <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">.apk</code> file in
                      under 60 seconds and triggers the zip download!
                    </li>
                  </ol>
                </div>

                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold items-center justify-center gap-2 transition-colors cursor-pointer text-center shadow-lg shadow-blue-600/30"
                >
                  <span>Launch PWABuilder &amp; Download Signed APK (.apk)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Other instant cloud converters */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
                <div className="font-bold text-amber-300">Alternative 1-Click Online APK Generators:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-200">WebIntoApp.com:</strong> Paste URL &rarr; choose icon &rarr; download direct APK file.
                  </li>
                  <li>
                    <strong className="text-slate-200">AppsGeyser.com:</strong> Creates an instant casino/gaming Android APK with custom splash screen.
                  </li>
                  <li>
                    <strong className="text-slate-200">Website2Apk:</strong> Desktop Windows software to turn any web URL into an APK.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: BUBBLEWRAP CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center text-xs">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-white">Google Bubblewrap CLI (Official Trusted Web Activity)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[10px]">
                    CLI Tool
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Bubblewrap is Google's official command line utility that reads your{' '}
                  <code className="text-amber-300">manifest.json</code> and compiles a native Android APK and Android App Bundle (.aab).
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => handleCopy(bubblewrapCmd, 'bubblewrap')}
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-sans flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'bubblewrap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy All</span>
                  </button>
                  <div className="text-slate-500"># 1. Install Bubblewrap CLI globally</div>
                  <div className="text-white">npm install -g @bubblewrap/cli</div>
                  <div className="text-slate-500"># 2. Initialize project from Small Casino manifest</div>
                  <div className="text-white">npx @bubblewrap/cli init --manifest={manifestUrl}</div>
                  <div className="text-slate-500"># 3. Compile signed APK</div>
                  <div className="text-white">npx @bubblewrap/cli build</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                  <div className="font-bold text-purple-400">Requirements:</div>
                  <div>• Node.js 18+ installed on your computer.</div>
                  <div>• JDK 17+ and Android SDK (Bubblewrap will offer to auto-download them on first run).</div>
                  <div>• Output: <code className="text-emerald-400">app-release-signed.apk</code> ready to install.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAPACITOR / ANDROID STUDIO */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-white">Capacitor by Ionic (Full Native Android Studio Project)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                    Full Native
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  If you want full native device capabilities (such as hardware vibration on casino wins, native camera for KYC document uploads, and Firebase Cloud Messaging push notifications):
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 space-y-1 relative">
                  <button
                    type="button"
                    onClick={() => handleCopy(capacitorCmd, 'cap')}
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-sans flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'cap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                  <div className="text-slate-500"># Install Capacitor dependencies</div>
                  <div className="text-white">npm i @capacitor/core @capacitor/cli @capacitor/android</div>
                  <div className="text-slate-500"># Initialize Android project</div>
                  <div className="text-white">npx cap init "Small Casino" com.smallcasino.app --web-dir dist</div>
                  <div className="text-white">npm run build &amp;&amp; npx cap add android</div>
                  <div className="text-white">npx cap open android</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <div className="font-bold text-amber-400">Build APK in Android Studio:</div>
                  <div>1. Once Android Studio opens, click <strong className="text-white">Build &rarr; Build Bundle(s) / APK(s) &rarr; Build APK(s)</strong>.</div>
                  <div>2. A notification appears with a "locate" link taking you straight to <code className="text-emerald-400">app-debug.apk</code>.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DISTRIBUTION & SOURCING */}
          {activeTab === 'distribution' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <h3 className="text-sm font-bold text-white">How Real Casino &amp; Betting Apps Distribute APKs</h3>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Real-money casino and sports betting applications (like 1xBet, Betway, Stake, and Parimatch) commonly distribute APKs{' '}
                  <strong className="text-emerald-400">directly to players from their website</strong> rather than only Google Play,
                  ensuring 100% availability without store fee cuts.
                </p>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-teal-400">Step 1: Host the .APK file online</div>
                    <p className="text-slate-400 text-[11px]">
                      Upload your compiled <code className="text-amber-300">SmallCasino.apk</code> to your web server (e.g. into{' '}
                      <code>public/download/SmallCasino.apk</code>), Google Drive, AWS S3, or MediaFire.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-teal-400">Step 2: Add a Direct "Download Android App" button</div>
                    <p className="text-slate-400 text-[11px]">
                      Link the button to your APK download URL so mobile visitors can tap and download the package in 1 second.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-bold text-teal-400">Step 3: Player Installation Instructions (Unknown Sources)</div>
                    <p className="text-slate-400 text-[11px]">
                      Android will ask for permission the first time a user installs an APK outside Google Play. Provide these simple instructions to your players:
                    </p>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                      <div>• When downloaded, tap <strong className="text-white">"Open"</strong> &rarr; <strong className="text-white">"Settings"</strong>.</div>
                      <div>• Toggle on <strong className="text-emerald-400">"Allow from this source"</strong> (Chrome / File Manager).</div>
                      <div>• Tap <strong className="text-white">"Install"</strong> &rarr; Small Casino icon appears on phone home screen!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA Manifest ID: Amankumar000997ehxn</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
