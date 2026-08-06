import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const commonShortcuts: ShortcutConfig[] = [
  { key: 'n', ctrl: true, action: () => console.log('New'), description: 'New' },
  { key: 's', ctrl: true, action: () => console.log('Save'), description: 'Save' },
  { key: 'f', ctrl: true, action: () => console.log('Find'), description: 'Find' },
  { key: 'r', ctrl: true, action: () => window.location.reload(), description: 'Refresh' },
  { key: 'Escape', action: () => console.log('Close'), description: 'Close modal' },
];