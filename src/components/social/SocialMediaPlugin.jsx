import React, { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  Share2, Sparkles, Upload, X, FileText, Loader2,
  Twitter, Linkedin, Instagram, Lock, Crown, CheckCircle2, Copy,
  CalendarClock, Link2, ChevronRight, BarChart2, LayoutList
} from 'lucide-react';
import SocialAccountsManager, { useSocialAccounts } from './SocialAccountsManager';
import PostIdeasPanel from './PostIdeasPanel';
import SchedulePostModal from './SchedulePostModal';
import SocialAnalytics from './SocialAnalytics';
import PostQueue from './PostQueue';

const PLATFORMS = [
  { id: 'twitter',   label: 'X / Twitter', icon: Twitter,   color: 'text-sky-400',  bg: 'bg-sky-500/10',   border: 'border-sky-500/30',  charLimit: 280 },
  { id: 'linkedin',  label: 'LinkedIn',    icon: Linkedin,   color: 'text-blue-400', bg: 'bg-blue-500/10',  border: 'border-blue-500/30', charLimit: 3000 },
  { id: 'instagram', label: 'Instagram',   icon: Instagram,  color: 'text-pink-400', bg: 'bg-pink-500/10',  border: 'border-pink-500/30', charLimit: 2200 },
];

const TONE_OPTIONS = ['Professional', 'Casual', 'Inspiring', 'Educational', 'Witty', 'Urgent'];

function SubscriptionGate({ onUnlock }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <Share2 className="h-10 w-10 text-violet-400" />
        </div>
        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
          <Crown className="h-4 w-4 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Social Media Plugin</h3>
      <p className="text-sm text-zinc-400 mb-1 max-w-xs">
        Let Epi craft and schedule platform-optimized posts from your vault content.
      </p>
      <div className="flex flex-col gap-2 mt-4 mb-6 text-left w-full max-w-xs">
        {[
          'Upload content — Epi writes platform-specific posts',
          'Tone & format controls per platform',
          'X, LinkedIn, Instagram outputs',
          'Connect accounts & schedule directly',
          'Scheduled posts queue with status tracking',
        ].map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
            {f}
          </div>
        ))}
      </div>
      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-4 px-3 py-1.5">
        <Crown className="h-3 w-3 mr-1.5" /> Pro Feature — Subscription Required
      </Badge>
      <Button onClick={onUnlock} className="bg-violet-600 hover:bg-violet-500">
        <Lock className="h-4 w-4 mr-2" /> Unlock Social Plugin
      </Button>
    </div>
  );
}

export default function SocialMediaPlugin({ open, onOpenChange, vault, isSubscribed: isSubscribedProp }) {
  const [unlocked, setUnlocked] = useState(isSubscribedProp || false);
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'accounts'

  // Compose state
  const [contentText, setContentText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [useVaultContext, setUseVaultContext] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'linkedin']);
  const [tone, setTone] = useState('Professional');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  // Scheduling state
  const [scheduleTarget, setScheduleTarget] = useState(null); // { platform, draft, hashtags }
  const { accounts, connect, disconnect } = useSocialAccounts();

  const connectedCount = Object.keys(accounts).length;

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(p => p !== id) : prev) : [...prev, id]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ name: file.name, url: file_url, type: file.type });
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    }
    setIsUploading(false);
  };

  const generatePosts = async () => {
    if (!contentText.trim() && !uploadedFile && !useVaultContext) {
      toast.error('Add content, upload a file, or use vault context');
      return;
    }
    setIsGenerating(true);
    setOutputs(null);
    try {
      let contentBlock = '';
      if (contentText.trim()) contentBlock += `Content:\n${contentText}\n\n`;
      if (useVaultContext && vault?.living_summary) contentBlock += `Vault Living Summary:\n${vault.living_summary.slice(0, 1500)}\n\n`;
      if (uploadedFile) contentBlock += `Uploaded file: ${uploadedFile.name}\n\n`;

      const platformDescs = selectedPlatforms.map(pid => {
        const p = PLATFORMS.find(pp => pp.id === pid);
        return `${p.label} (max ${p.charLimit} chars)`;
      }).join(', ');

      const prompt = `You are Epi, an AI that crafts social media posts. Given the following content, write optimized posts for: ${platformDescs}.

Tone: ${tone}
${instructions ? `Special instructions: ${instructions}` : ''}

${contentBlock}

For each platform output:
- A ready-to-post draft within character limits
- 3-5 relevant hashtags (without the # symbol)
- A one-line rationale for your formatting choices

Format your response as JSON.`;

      const schema = {
        type: 'object',
        properties: Object.fromEntries(selectedPlatforms.map(pid => [
          pid,
          {
            type: 'object',
            properties: {
              draft: { type: 'string' },
              hashtags: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
            }
          }
        ]))
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
        file_urls: uploadedFile ? [uploadedFile.url] : undefined,
      });

      setOutputs(result);
      toast.success('Posts generated!');
    } catch {
      toast.error('Generation failed');
    }
    setIsGenerating(false);
  };

  const copyPost = (text, hashtags) => {
    navigator.clipboard.writeText(`${text}\n\n${hashtags?.map(h => `#${h}`).join(' ')}`);
    toast.success('Copied!');
  };

  if (!unlocked) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[520px] sm:max-w-[520px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
          <SheetHeader className="p-4 pb-3 border-b border-zinc-800 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Share2 className="h-4 w-4 text-violet-400" /> Social Plugin
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] ml-1">Pro</Badge>
            </SheetTitle>
          </SheetHeader>
          <SubscriptionGate onUnlock={() => setUnlocked(true)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[640px] sm:max-w-[640px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0 border-b border-zinc-800 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <SheetTitle className="flex items-center gap-2 text-white">
                <Share2 className="h-4 w-4 text-violet-400" /> Social Plugin
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                  <Crown className="h-2.5 w-2.5 mr-1" /> Pro
                </Badge>
              </SheetTitle>
              {connectedCount > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> {connectedCount} account{connectedCount > 1 ? 's' : ''} connected
                </Badge>
              )}
            </div>
            {/* Tabs */}
            <div className="flex gap-0">
              {[
                { id: 'compose',   label: 'Compose',   icon: Sparkles },
                { id: 'analytics', label: 'Analytics', icon: BarChart2 },
                { id: 'queue',     label: 'Queue',     icon: LayoutList },
                { id: 'accounts',  label: 'Accounts',  icon: Link2, badge: connectedCount || undefined },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'text-violet-400 border-violet-500'
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.badge !== undefined && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">

              {/* ── ANALYTICS TAB ── */}
              {activeTab === 'analytics' && <SocialAnalytics />}

              {/* ── QUEUE TAB ── */}
              {activeTab === 'queue' && <PostQueue />}

              {/* ── ACCOUNTS TAB ── */}
              {activeTab === 'accounts' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Connect your social accounts to enable direct post scheduling. Epi will queue posts for the linked handles.
                  </p>
                  <SocialAccountsManager accounts={accounts} onConnect={connect} onDisconnect={disconnect} />
                  <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 mt-2">
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      <span className="text-zinc-300 font-medium">Note:</span> In production, connecting an account launches a full OAuth 2.0 flow with the platform. Tokens are stored securely and never exposed to the frontend.
                    </p>
                  </div>
                </div>
              )}

              {/* ── COMPOSE TAB ── */}
              {activeTab === 'compose' && (
                <>
                  {/* Platforms */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block font-medium">Target Platforms</label>
                    <div className="flex gap-2 flex-wrap">
                      {PLATFORMS.map(p => {
                        const Icon = p.icon;
                        const active = selectedPlatforms.includes(p.id);
                        const connected = !!accounts[p.id];
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                              active ? cn(p.bg, p.border, p.color) : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" /> {p.label}
                            {connected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Account connected" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content Input */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Content / Draft / Raw Idea</label>
                    <Textarea
                      value={contentText}
                      onChange={e => setContentText(e.target.value)}
                      placeholder="Paste your draft, bullet points, or raw idea here…"
                      className="bg-zinc-800 border-zinc-700 text-white text-sm resize-none min-h-[90px]"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* File Upload + Vault Toggle */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploading || isGenerating}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                    >
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploadedFile ? uploadedFile.name : 'Upload file'}
                    </button>
                    {uploadedFile && (
                      <button onClick={() => setUploadedFile(null)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {vault?.living_summary && (
                      <button
                        onClick={() => setUseVaultContext(v => !v)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all',
                          useVaultContext
                            ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Use Vault Summary
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block font-medium">Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TONE_OPTIONS.map(t => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs transition-colors',
                            tone === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Instructions to Epi <span className="text-zinc-600">(optional)</span></label>
                    <Textarea
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      placeholder="e.g. 'Lead with a question', 'Mention our product launch', 'Avoid jargon'…"
                      className="bg-zinc-800 border-zinc-700 text-white text-xs resize-none min-h-[55px]"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Generate */}
                  <Button
                    onClick={generatePosts}
                    disabled={isGenerating || selectedPlatforms.length === 0}
                    className="w-full bg-violet-600 hover:bg-violet-500 h-11 text-white"
                  >
                    {isGenerating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Epi is writing…</>
                      : <><Sparkles className="h-4 w-4 mr-2" /> Generate Posts</>
                    }
                  </Button>

                  {/* Outputs */}
                  {outputs && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-zinc-300">Generated Drafts</p>
                      {selectedPlatforms.map(pid => {
                        const p = PLATFORMS.find(pp => pp.id === pid);
                        const Icon = p.icon;
                        const out = outputs[pid];
                        if (!out) return null;
                        const isConnected = !!accounts[pid];
                        return (
                          <div key={pid} className={cn('rounded-xl border p-4 space-y-3', p.bg, p.border)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={cn('h-4 w-4', p.color)} />
                                <span className={cn('text-sm font-semibold', p.color)}>{p.label}</span>
                                <span className="text-[10px] text-zinc-600">{out.draft?.length || 0} / {p.charLimit} chars</span>
                                {isConnected && (
                                  <Badge className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-400 border-0">
                                    @{accounts[pid]}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => copyPost(out.draft, out.hashtags)}
                                  className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                                >
                                  <Copy className="h-3 w-3" /> Copy
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{out.draft}</p>

                            {out.hashtags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {out.hashtags.map((h, i) => (
                                  <span key={i} className={cn('text-[10px] px-1.5 py-0.5 rounded', p.color, 'bg-black/20')}>#{h}</span>
                                ))}
                              </div>
                            )}

                            {out.rationale && (
                              <p className="text-[10px] text-zinc-600 italic border-t border-zinc-800/50 pt-2">{out.rationale}</p>
                            )}

                            {/* Schedule CTA */}
                            <div className="border-t border-zinc-800/50 pt-3">
                              {isConnected ? (
                                <Button
                                  size="sm"
                                  onClick={() => setScheduleTarget({ platform: pid, draft: out.draft, hashtags: out.hashtags })}
                                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 h-8 text-xs border border-zinc-700"
                                >
                                  <CalendarClock className="h-3.5 w-3.5 mr-2 text-violet-400" />
                                  Schedule Post
                                  <ChevronRight className="h-3 w-3 ml-auto text-zinc-600" />
                                </Button>
                              ) : (
                                <button
                                  onClick={() => setActiveTab('accounts')}
                                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-zinc-700 text-[10px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                                >
                                  <Link2 className="h-3 w-3" />
                                  Connect a {p.label} account to schedule
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Schedule Modal */}
      {scheduleTarget && (
        <SchedulePostModal
          platform={scheduleTarget.platform}
          draft={scheduleTarget.draft}
          hashtags={scheduleTarget.hashtags}
          vault={vault}
          accountHandle={accounts[scheduleTarget.platform]}
          tone={tone}
          onClose={() => setScheduleTarget(null)}
          onScheduled={() => setScheduleTarget(null)}
        />
      )}
    </>
  );
}