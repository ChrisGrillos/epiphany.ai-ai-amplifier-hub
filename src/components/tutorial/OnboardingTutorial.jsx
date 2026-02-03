import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Sparkles, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const tutorialSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Epiphany.AI',
    description: 'Your AI Amplifier Hub - a powerful system for managing context, coordinating AI workflows, and amplifying your thinking.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Epiphany.AI helps you:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Maintain <strong>Living Summaries</strong> that evolve with your conversations</li>
          <li>Bridge between different AI systems seamlessly</li>
          <li>Organize context with <strong>Vaults</strong> and <strong>References</strong></li>
          <li>Leverage <strong>Epi</strong>, your orchestration intelligence</li>
        </ul>
      </div>
    )
  },
  {
    id: 'create_vault',
    title: 'Create Your First Vault',
    description: 'Vaults are containers for your context. Each vault has a Living Summary that grows with your work.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Click the <strong className="text-violet-400">+ New Vault</strong> button in the sidebar to create your first vault.</p>
        <p className="text-xs text-zinc-500">💡 Tip: Create separate vaults for different projects, topics, or workflows.</p>
      </div>
    ),
    action: 'create_vault'
  },
  {
    id: 'chat_basics',
    title: 'Start a Conversation',
    description: 'Chat with your configured AI (API tab) or talk to Epi (Epi tab) for context coordination.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p><strong>API Tab:</strong> Direct access to your configured AI (Grok, ChatGPT, etc.)</p>
        <p><strong>Epi Tab:</strong> Context management - condense chats, prepare context packs, vault summaries</p>
        <p className="text-xs text-zinc-500">💡 All conversations build your vault's Living Summary</p>
      </div>
    ),
    action: 'send_message'
  },
  {
    id: 'references',
    title: 'Add References',
    description: 'Upload files to provide context. Reference files can be attached to sessions for richer conversations.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Click <strong>References</strong> in the header, then <strong>+ Add</strong> to upload files.</p>
        <p>Supported formats: TXT, MD, CSV, JSON</p>
        <p className="text-xs text-zinc-500">💡 References stay in your vault and can be attached to any session</p>
      </div>
    ),
    action: 'add_reference'
  },
  {
    id: 'synthesis',
    title: 'End Session & Synthesize',
    description: 'When you finish a conversation, synthesize it to update your Living Summary with new insights.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Click <strong className="text-violet-400">End Session & Synthesize</strong> to extract durable insights.</p>
        <p>The AI will propose updates to your Living Summary - review and accept changes.</p>
        <p className="text-xs text-zinc-500">💡 Sessions auto-save every 2 minutes and auto-close after 30 min of inactivity</p>
      </div>
    ),
    action: 'synthesize'
  },
  {
    id: 'epi_features',
    title: 'Epi: Your AI Concierge',
    description: 'Epi is your orchestration layer - it helps coordinate between AIs and manage your context.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p><strong>What Epi can do:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
          <li>Condense pasted web chats into structured notes</li>
          <li>Prepare context packs for external AI</li>
          <li>Generate vault refresh summaries</li>
          <li>Check vault health and suggest cleanup</li>
          <li>Orchestrate multi-agent workflows</li>
        </ul>
        <p className="text-xs text-zinc-500">💡 Click Epi's avatar (bottom-left) to adjust intelligence level</p>
      </div>
    )
  },
  {
    id: 'moltbook',
    title: 'Connect Moltbook Agents',
    description: 'Extend your hub by connecting agents from Moltbook for specialized tasks.',
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Switch to the <strong className="text-emerald-400">Moltbook Agents</strong> tab to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
          <li>Auto-discover compatible agents</li>
          <li>Manually connect agents via API key</li>
          <li>Chat with agents using your vault context</li>
        </ul>
      </div>
    )
  }
];

export default function OnboardingTutorial({ open, onOpenChange, tutorialProgress, onUpdateProgress, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = tutorialSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      onUpdateProgress(tutorialSteps[newIndex].id);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-zinc-500 hover:text-white -mt-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-zinc-400">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep.content}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Step {currentStepIndex + 1} of {tutorialSteps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {tutorialSteps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={cn(
                "h-2 rounded-full transition-all",
                idx === currentStepIndex ? "w-8 bg-violet-500" : "w-2 bg-zinc-700 hover:bg-zinc-600"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-zinc-400 hover:text-white"
          >
            Skip Tutorial
          </Button>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {currentStepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}