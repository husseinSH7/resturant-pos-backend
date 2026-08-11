
interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ shortcuts, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.ctrl && <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Ctrl</kbd>}
                {shortcut.shift && <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Shift</kbd>}
                {shortcut.alt && <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Alt</kbd>}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">{shortcut.key}</kbd>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}