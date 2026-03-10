import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { userScopedEntities } from '@/components/lib/userScoped';

export default function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickTips, setShowQuickTips] = useState(false);
  const [tutorialProgress, setTutorialProgress] = useState(null);

  useEffect(() => {
    const loadTutorialProgress = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const scopedDb = userScopedEntities(user);

        const progress = await scopedDb.TutorialProgress.list();
        if (progress.length > 0) {
          setTutorialProgress(progress[0]);
          if (progress[0].tutorial_active && !progress[0].dismissed) {
            setShowTutorial(true);
          }
        } else {
          const newProgress = await scopedDb.TutorialProgress.create({
            tutorial_active: true,
            completed_steps: [],
            current_step: 'welcome',
          });
          setTutorialProgress(newProgress);
          setShowTutorial(true);
        }
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
      }
    };
    loadTutorialProgress();
  }, []);

  useEffect(() => {
    if (tutorialProgress && !tutorialProgress.tutorial_active && !tutorialProgress.dismissed) {
      const timer = setTimeout(() => setShowQuickTips(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [tutorialProgress]);

  const handleUpdateTutorialProgress = async (stepId) => {
    if (!tutorialProgress) return;
    try {
      const updated = await base44.entities.TutorialProgress.update(tutorialProgress.id, {
        current_step: stepId,
        completed_steps: [...new Set([...tutorialProgress.completed_steps, stepId])],
      });
      setTutorialProgress(updated);
    } catch (error) {
      console.error('Failed to update tutorial progress:', error);
    }
  };

  const handleCompleteTutorial = async () => {
    if (!tutorialProgress) return;
    try {
      await base44.entities.TutorialProgress.update(tutorialProgress.id, {
        tutorial_active: false,
        dismissed: true,
      });
      setShowTutorial(false);
      toast.success('Tutorial completed! 🎉');
      setTimeout(() => setShowQuickTips(true), 1000);
    } catch (error) {
      console.error('Failed to complete tutorial:', error);
    }
  };

  return {
    showTutorial,
    setShowTutorial,
    showQuickTips,
    setShowQuickTips,
    tutorialProgress,
    handleUpdateTutorialProgress,
    handleCompleteTutorial,
  };
}
