
import React, { useEffect, useState } from 'react';
import { Asset, AssetStatus, AppSettings } from '../types';
import { DataService } from '../services/dataService';
import { Search, Filter, Plus, MoreVertical, X, Save, FileText, ExternalLink, HardDrive, Settings as SettingsIcon } from 'lucide-react';

interface AssetListProps {
  settings?: AppSettings;
  setActiveTab?: (tab: string) => void;
}

const AssetList: React.FC<AssetListProps> = ({ settings, setActiveTab }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Asset Form State
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    id: '',
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    department: '',
    purchaseDate: '',
    price: 0,
    status: AssetStatus.ACTIVE,
    nextPmDate: '',
    manualUrl: '',
    googleDriveUrl: ''
  });

  useEffect(() => {
    DataService.getAssets().then(setAssets);
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAsset.name && newAsset.serialNumber) {
        try {
            const added = await DataService.addAsset(newAsset);
            setAssets([added, ...assets]);
            setIsModalOpen(false);
            // Reset form
            setNewAsset({
                id: '', name: '', brand: '', model: '', serialNumber: '', department: '', 
                purchaseDate: '', price: 0, status: AssetStatus.ACTIVE, nextPmDate: '', manualUrl: '', googleDriveUrl: ''
            });
            alert('เพิ่มครุภัณฑ์เรียบร้อยแล้ว');
        } catch (error: any) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        }
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.id.toLowerCase().includes(search.toLowerCase()) ||
                          asset.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === 'All' || asset.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.ACTIVE: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">พร้อมใช้</span>;
      case AssetStatus.REPAIR: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">ส่งซ่อม</span>;
      case AssetStatus.MAINTENANCE_DUE: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">ถึงรอบ PM</span>;
      case AssetStatus.LOANED: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">ถูกยืม</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const departments = settings?.departments || ['ER', 'ICU', 'OPD', 'Radiology', 'Pediatrics'];
  const uniqueDepts = Array.from(new Set(assets.map(a => a.department)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">ทะเบียนครุภัณฑ์ (Asset Register)</h2>
           <p className="text-sm text-slate-500">จัดการข้อมูลและประวัติเครื่องมือแพทย์</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มครุภัณฑ์ใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาตามชื่อ, รหัสทรัพย์สิน หรือ Serial Number..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">ทุกแผนก</option>
            {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ข้อมูลอุปกรณ์</th>
                <th className="px-6 py-4">เอกสาร</th>
                <th className="px-6 py-4">Serial No.</th>
                <th className="px-6 py-4">แผนก</th>
                <th className="px-6 py-4">PM ครั้งถัดไป</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {asset.image ? (
                            <img src={asset.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-xs text-slate-400">No img</span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-slate-900">{asset.name}</div>
                        <div className="text-xs text-slate-400">{asset.id} • {asset.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                        {asset.manualUrl && (
                        <a href={asset.manualUrl} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-700 flex items-center gap-1" title="คู่มือ/เอกสาร">
                            <FileText className="w-5 h-5" />
                        </a>
                        )}
                        {asset.googleDriveUrl && (
                        <a href={asset.googleDriveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center gap-1" title="Google Drive">
                            <HardDrive className="w-5 h-5" />
                        </a>
                        )}
                        {!asset.manualUrl && !asset.googleDriveUrl && <span className="text-slate-300">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{asset.serialNumber}</td>
                  <td className="px-6 py-4">{asset.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs">
                       <span className={new Date(asset.nextPmDate) < new Date() ? "text-red-500 font-bold" : "text-slate-500"}>
                         {asset.nextPmDate}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(asset.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลครุภัณฑ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">เพิ่มครุภัณฑ์ใหม่</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleAddAsset} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">เลขครุภัณฑ์ (Asset ID)</label>
                            <input type="text" className="w-full border rounded-lg px-3 py-2 bg-slate-50" placeholder="ว่างไว้เพื่อสร้างอัตโนมัติ"
                                value={newAsset.id} onChange={e => setNewAsset({...newAsset, id: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number *</label>
                            <input type="text" required className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อครุภัณฑ์ *</label>
                            <input type="text" required className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ (Brand)</label>
                            <input type="text" className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">รุ่น (Model)</label>
                            <input type="text" className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.model} onChange={e => setNewAsset({...newAsset, model: e.target.value})} />
                        </div>
                       
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">แผนก *</label>
                                {setActiveTab && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setActiveTab('settings');
                                        }}
                                        className="text-xs text-primary-600 hover:underline flex items-center"
                                    >
                                        <SettingsIcon className="w-3 h-3 mr-1" /> จัดการแผนก
                                    </button>
                                )}
                            </div>
                            <select className="w-full border rounded-lg px-3 py-2 bg-white" required
                                value={newAsset.department} onChange={e => setNewAsset({...newAsset, department: e.target.value})}>
                                <option value="">เลือกแผนก</option>
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">วันที่รับเข้า</label>
                            <input type="date" className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท)</label>
                            <input type="number" className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: Number(e.target.value)})} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">รอบ PM ถัดไป</label>
                            <input type="date" className="w-full border rounded-lg px-3 py-2" 
                                value={newAsset.nextPmDate} onChange={e => setNewAsset({...newAsset, nextPmDate: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                    <FileText className="w-4 h-4 mr-1 text-red-500" /> ลิงก์เอกสารคู่มือ (PDF URL)
                                </label>
                                <input 
                                    type="url" 
                                    placeholder="https://example.com/manual.pdf"
                                    className="w-full border rounded-lg px-3 py-2" 
                                    value={newAsset.manualUrl} 
                                    onChange={e => setNewAsset({...newAsset, manualUrl: e.target.value})} 
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                    <HardDrive className="w-4 h-4 mr-1 text-blue-500" /> ลิงก์ Google Drive
                                </label>
                                <input 
                                    type="url" 
                                    placeholder="https://drive.google.com/..."
                                    className="w-full border rounded-lg px-3 py-2" 
                                    value={newAsset.googleDriveUrl} 
                                    onChange={e => setNewAsset({...newAsset, googleDriveUrl: e.target.value})} 
                                />
                             </div>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center">
                            <Save className="w-4 h-4 mr-2" /> บันทึกข้อมูล
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
