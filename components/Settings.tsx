
import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, MessageCircle, Hospital, Database, Download, Upload, Cloud } from 'lucide-react';
import { AppSettings } from '../types';
import { DataService } from '../services/dataService';

interface SettingsProps {
  onSettingsChange: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<AppSettings>({
    hospitalName: 'MedEquip Manager',
    logoUrl: '',
    backgroundUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
    googleScriptUrl: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('medEquipSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem('medEquipSettings', JSON.stringify(settings));
    onSettingsChange(settings);
    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof AppSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSettings(prev => ({ ...prev, [field]: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = async () => {
      const jsonStr = await DataService.exportAllData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medequip_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
             const success = await DataService.importData(event.target?.result as string);
             if(success) alert('นำเข้าข้อมูลสำเร็จ! กรุณารีเฟรชหน้าจอ');
             else alert('ไฟล์ข้อมูลไม่ถูกต้อง');
          };
          reader.readAsText(file);
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-slate-200 rounded-xl">
             <Hospital className="w-8 h-8 text-slate-700" />
        </div>
        <div>
           <h2 className="text-3xl font-bold text-slate-800">ตั้งค่าระบบ (System Settings)</h2>
           <p className="text-slate-500">ปรับแต่งหน้าตา, การเชื่อมต่อ และจัดการฐานข้อมูล</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Appearance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          <h3 className="font-bold text-xl text-slate-800 flex items-center border-b pb-3">
            <ImageIcon className="w-5 h-5 mr-3 text-primary-600" /> การแสดงผล (Appearance)
          </h3>
          
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">ชื่อหน่วยงาน/โรงพยาบาล</label>
            <input 
              name="hospitalName"
              value={settings.hospitalName}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="Ex. โรงพยาบาลกลาง"
            />
          </div>

          <div>
             <label className="block text-base font-semibold text-slate-700 mb-2">โลโก้ (Logo)</label>
             <div className="flex items-center space-x-4">
               {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="h-16 w-16 object-contain border rounded-lg bg-slate-100" />}
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={(e) => handleFileChange(e, 'logoUrl')}
                 className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
               />
             </div>
          </div>

          <div>
             <label className="block text-base font-semibold text-slate-700 mb-2">ภาพพื้นหลัง (Background)</label>
             <div className="flex items-center space-x-4">
               {settings.backgroundUrl && (
                  <div className="h-16 w-24 bg-cover bg-center border rounded-lg" style={{backgroundImage: `url(${settings.backgroundUrl})`}}></div>
               )}
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={(e) => handleFileChange(e, 'backgroundUrl')}
                 className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
               />
             </div>
          </div>
        </div>

        <div className="space-y-6">
            {/* Database Connection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                <h3 className="font-bold text-xl text-slate-800 flex items-center border-b pb-3">
                    <Cloud className="w-5 h-5 mr-3 text-emerald-500" /> เชื่อมต่อฐานข้อมูล (Database)
                </h3>
                
                <div className="bg-emerald-50 p-4 rounded-xl text-sm text-emerald-800 mb-4">
                    <p className="font-semibold">Google Sheets Integration:</p>
                    <p>นำ Web App URL จาก Google Apps Script มาใส่ที่นี่เพื่อเปิดใช้งานระบบออนไลน์</p>
                </div>

                <div>
                    <label className="block text-base font-semibold text-slate-700 mb-2">Google Apps Script URL</label>
                    <input 
                        name="googleScriptUrl"
                        value={settings.googleScriptUrl || ''}
                        onChange={handleChange}
                        className="w-full border rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                        placeholder="https://script.google.com/macros/s/..."
                    />
                </div>
            </div>

            {/* Telegram Integration */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
            <h3 className="font-bold text-xl text-slate-800 flex items-center border-b pb-3">
                <MessageCircle className="w-5 h-5 mr-3 text-blue-500" /> การแจ้งเตือน (Notifications)
            </h3>
            
            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-4">
                <p className="font-semibold">วิธีตั้งค่า Telegram Bot:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>สร้าง Bot ผ่าน @BotFather และรับ API Token</li>
                <li>สร้างกลุ่ม และดึง Bot เข้ากลุ่ม</li>
                <li>หา Chat ID ของกลุ่ม (เช่นใช้ @userinfobot)</li>
                </ol>
            </div>

            <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Bot API Token</label>
                <input 
                name="telegramBotToken"
                type="password"
                value={settings.telegramBotToken}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
            </div>

            <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Chat ID</label>
                <input 
                name="telegramChatId"
                value={settings.telegramChatId}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="-100123456789"
                />
            </div>
            </div>
        </div>
      </div>

      {/* Database Management */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-xl text-slate-800 flex items-center border-b pb-3 mb-5">
            <Database className="w-5 h-5 mr-3 text-slate-600" /> สำรอง/กู้คืนข้อมูล (Local Backup)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
                <h4 className="font-semibold text-slate-700 flex items-center">
                    <Download className="w-4 h-4 mr-2" /> สำรองข้อมูล (Export)
                </h4>
                <p className="text-sm text-slate-500">ดาวน์โหลดข้อมูลทั้งหมดในระบบเก็บไว้เป็นไฟล์ JSON</p>
                <button 
                    onClick={handleExportData}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition flex items-center"
                >
                    <Download className="w-4 h-4 mr-2" /> Export Database
                </button>
             </div>

             <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
                <h4 className="font-semibold text-slate-700 flex items-center">
                    <Upload className="w-4 h-4 mr-2" /> นำเข้าข้อมูล (Import)
                </h4>
                <p className="text-sm text-slate-500">กู้คืนข้อมูลจากไฟล์ Backup (.json) เฉพาะโหมด Offline</p>
                <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImportData}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                />
             </div>
          </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition font-bold text-lg flex items-center"
        >
          <Save className="w-5 h-5 mr-2" /> บันทึกการตั้งค่าทั้งหมด
        </button>
      </div>
    </div>
  );
};

export default Settings;
