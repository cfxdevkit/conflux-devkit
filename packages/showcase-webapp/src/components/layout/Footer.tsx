
export function Footer() {
  return (
    <footer className="bg-gray-900 text-white fixed bottom-0 left-0 right-0 z-30">
      <div className="px-6 py-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <p>&copy; 2024 Conflux DevKit. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span>Status: Ready</span>
            <span>Version: 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}