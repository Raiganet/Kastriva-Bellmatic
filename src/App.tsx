import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AudioPage } from './pages/AudioPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { CalendarPage } from './pages/CalendarPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { MonitorPage } from './pages/MonitorPage';
import { TestBellPage } from './pages/TestBellPage';
import { useAppStore } from './stores/useAppStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useTheme } from './hooks/useTheme';
import { SchedulerService } from './services/schedulerService';
import { playAudio } from './services/audioService';
import { db } from './database/db';

// Singleton scheduler
const scheduler = new SchedulerService(
  (audio, vol) => playAudio(audio, vol),
  () => useSettingsStore.getState().settings.volume,
);

export function App() {
  useTheme();
  const { page } = useAppStore();
  const { load, settings } = useSettingsStore();
  const { audioUnlocked, setSchedulerActive } = useAppStore();

  useEffect(() => {
    load();
  }, [load]);

  // Start/stop scheduler based on audio unlock + settings
  useEffect(() => {
    if (audioUnlocked && settings.schedulerEnabled) {
      scheduler.start();
      setSchedulerActive(true);
    } else {
      scheduler.stop();
      setSchedulerActive(false);
    }
  }, [audioUnlocked, settings.schedulerEnabled, setSchedulerActive]);

  // Cleanup executed log > 7 hari untuk hemat storage
  useEffect(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    db.executed.where('executedAt').below(cutoff).delete();
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'audio': return <AudioPage />;
      case 'schedules': return <SchedulesPage />;
      case 'calendar': return <CalendarPage />;
      case 'templates': return <TemplatesPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      case 'monitor': return <MonitorPage />;
      case 'test': return <TestBellPage />;
      default: return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}
