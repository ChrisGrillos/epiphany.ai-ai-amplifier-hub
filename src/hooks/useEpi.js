import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { getEffectiveEpiLevel } from '@/components/epi/epiUtils';
import { userScopedEntities } from '@/components/lib/userScoped';

export default function useEpi({ activeVault, db }) {
  const [epiLevel, setEpiLevel] = useState(1);
  const [epiNudge, setEpiNudge] = useState(null);
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const scopedDb = userScopedEntities(user);

        const settings = await scopedDb.AppSettings.list();
        if (settings.length > 0) {
          setAppSettings(settings[0]);
          setEpiLevel(getEffectiveEpiLevel(activeVault, settings[0]));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeVault && appSettings) {
      setEpiLevel(getEffectiveEpiLevel(activeVault, appSettings));
    }
  }, [activeVault, appSettings]);

  const handleUpdateEpiLevel = async (newLevel) => {
    try {
      if (appSettings) {
        await base44.entities.AppSettings.update(appSettings.id, { epi_level: newLevel });
        setAppSettings((prev) => ({ ...prev, epi_level: newLevel }));
      } else {
        const settings = await base44.entities.AppSettings.create({ epi_level: newLevel });
        setAppSettings(settings);
      }
      setEpiLevel(newLevel);
      toast.success(`Epi set to Level ${newLevel}`);
    } catch (error) {
      toast.error('Failed to update Epi level');
    }
  };

  return {
    epiLevel,
    setEpiLevel,
    epiNudge,
    setEpiNudge,
    appSettings,
    handleUpdateEpiLevel,
  };
}
