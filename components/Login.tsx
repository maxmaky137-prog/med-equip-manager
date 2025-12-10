import React, { useState } from 'react';
import { Activity, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    if (email && password) {
      onLogin();
    } else {
      alert('กรุณากรอกอีเมลและรหัสผ่าน');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary-100 rounded-full">
            <Activity className="w-10 h-10 text-primary-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          {isRegistering ? 'ลงทะเบียนใช้งาน' : 'เข้าสู่ระบบ'}
        </h2>
        <p className="text-center text-slate-500 mb-8">
          MedEquip Manager - ระบบจัดการครุภัณฑ์การแพทย์
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล / ชื่อผู้ใช้</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="admin@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium shadow-sm mt-6"
          >
            {isRegistering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isRegistering ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary-600 font-semibold hover:underline"
          >
            {isRegistering ? 'เข้าสู่ระบบ' : 'สมัครใช้งาน'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;