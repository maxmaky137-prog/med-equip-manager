
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import DailyCheck from './components/DailyCheck';
import MaintenanceView from './components/MaintenanceView';
import LoanSystem from './components/LoanSystem';
import Compliance from './components/Compliance';
import Settings from './components/Settings';
import Login from './components/Login';
import { Menu } from 'lucide-react';
import { AppSettings } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // App Settings State (Logo, Background, Telegram)
  const [settings, setSettings] = useState<AppSettings>({
    hospitalName: 'MedEquip Manager',
    logoUrl: '',
    backgroundUrl: '',
    telegramBotToken: '',
    telegramChatId: ''
  });

  useEffect(() => {
    // Load settings on boot
    const saved = localStorage.getItem('medEquipSettings');
    if (saved) {
        setSettings(JSON.parse(saved));
    }
  }, []);

  // Simple login handler
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'assets': return <AssetList />;
      case 'checks': return <DailyCheck />;
      case 'maintenance': return <MaintenanceView />;
      case 'loans': return <LoanSystem />;
      case 'compliance': return <Compliance />;
      case 'settings': return <Settings onSettingsChange={setSettings} />;
      default: return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div 
        className="min-h-screen flex bg-slate-50 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: settings.backgroundUrl ? `url(${settings.backgroundUrl})` : 'none' }}
    >
      {/* Background Overlay to ensure text readability if image is present */}
      <div className={`fixed inset-0 z-0 pointer-events-none ${settings.backgroundUrl ? 'bg-white/90 backdrop-blur-sm' : ''}`}></div>

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        settings={settings}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 transition-all duration-300 relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur h-16 border-b border-slate-200 sticky top-0 z-10 px-4 flex items-center justify-between shadow-sm">
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center text-lg font-semibold text-primary-700 pl-2 lg:pl-0">
             {settings.hospitalName}
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-sm">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold border border-primary-200">
                  A
                </div>
                <div className="hidden sm:block text-right">
                    <p className="font-medium text-slate-700 leading-tight">Admin User</p>
                    <p className="text-xs text-slate-400">ผู้ดูแลระบบ</p>
                </div>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
