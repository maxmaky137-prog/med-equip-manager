
import React, { useEffect, useState } from 'react';
import { MaintenanceRecord, MaintenanceType, Asset } from '../types';
import { DataService } from '../services/dataService';
import { Wrench, Clock, CheckCircle2, AlertOctagon, X, Save, FileText, Bell } from 'lucide-react';

const MaintenanceView: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkingPM, setCheckingPM] = useState(false);
  
  // Request Form State
  const [request, setRequest] = useState({
    assetId: '',
    assetName: '',
    technician: '',
    description: '',
    requestDate: new Date().toISOString().split('T')[0],
    attachmentUrl: ''
  });

  useEffect(() => {
    DataService.getMaintenanceRecords().then(setRecords);
    DataService.getAssets().then(setAssets);
  }, []);

  const handleAssetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAsset = assets.find(a => a.id === e.target.value);
    setRequest({
        ...request,
        assetId: e.target.value,
        assetName: selectedAsset ? selectedAsset.name : ''
    });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (request.assetId && request.description) {
        const newRecord = await DataService.addMaintenanceRequest({
            assetId: request.assetId,
            assetName: request.assetName,
            type: MaintenanceType.CM,
            requestDate: request.requestDate,
            technician: request.technician || 'Pending Assignment',
            description: request.description,
            cost: 0,
            attachmentUrl: request.attachmentUrl
        });
        setRecords([newRecord, ...records]);
        setIsModalOpen(false);
        setRequest({ assetId: '', assetName: '', technician: '', description: '', requestDate: new Date().toISOString().split('T')[0], attachmentUrl: '' });
        alert('แจ้งซ่อมเรียบร้อยแล้ว');
    }
  };

  const handleCheckUpcomingPM = async () => {
      setCheckingPM(true);
      const count = await DataService.checkUpcomingPMs();
      setCheckingPM(false);
      alert(count > 0 
        ? `ส่งแจ้งเตือน PM ล่วงหน้า ${count} รายการ ไปยัง Telegram แล้ว` 
        : `ไม่มีรายการ PM ที่ครบกำหนดใน 7 วันนี้`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulation: In real app, upload to server. Here we use FileReader for local demo/blob
      // or just input text for URL. For this demo, let's pretend we get a URL or base64.
      const reader = new FileReader();
      reader.onloadend = () => {
        setRequest(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">ระบบแจ้งซ่อม & PM</h2>
           <p className="text-sm text-slate-500">จัดการตารางซ่อมบำรุงและแจ้งเหตุขัดข้อง</p>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={handleCheckUpcomingPM}
                disabled={checkingPM}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-sm flex items-center transition disabled:opacity-50"
            >
              <Bell className="w-4 h-4 mr-2" />
              {checkingPM ? 'Checking...' : 'ตรวจสอบแจ้งเตือน PM'}
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow-sm flex items-center transition"
            >
              <AlertOctagon className="w-4 h-4 mr-2" />
              แจ้งซ่อม (Request Repair)
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Active Maintenance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">รายการซ่อม/บำรุงรักษา (Active Jobs)</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3">อุปกรณ์</th>
                  <th className="px-6 py-3">ประเภท</th>
                  <th className="px-6 py-3">วันที่แจ้ง</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3">ไฟล์แนบ</th>
                  <th className="px-6 py-3">ผู้ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{record.assetName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs border ${
                        record.type === MaintenanceType.PM ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {record.type === MaintenanceType.PM ? 'PM' : 'Repair'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{record.requestDate}</td>
                    <td className="px-6 py-4">
                      {record.status === 'Completed' ? (
                        <span className="text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> เสร็จสิ้น</span>
                      ) : (
                        <span className="text-amber-600 flex items-center"><Clock className="w-4 h-4 mr-1"/> {record.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                         {record.attachmentUrl ? (
                            <a href={record.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 flex items-center" title="เปิดเอกสาร">
                                <FileText className="w-5 h-5" />
                            </a>
                         ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{record.technician || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PM Schedule / Upcoming */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center mb-4 text-slate-800">
            <Wrench className="w-5 h-5 mr-2 text-primary-600" />
            <h3 className="font-semibold text-lg">แผน PM เร็วๆนี้</h3>
          </div>
          <div className="space-y-4">
             {/* Dynamic Upcoming Logic (Mocked visual for now based on data) */}
             {assets
                .filter(a => a.nextPmDate)
                .sort((a,b) => new Date(a.nextPmDate).getTime() - new Date(b.nextPmDate).getTime())
                .slice(0, 3)
                .map(asset => (
                <div key={asset.id} className="p-3 border border-slate-200 rounded-lg hover:border-primary-300 transition cursor-pointer">
                    <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-slate-700">{asset.name}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{asset.nextPmDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{asset.department}</p>
                </div>
             ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
             <h4 className="text-sm font-semibold mb-2">สถานะระบบแจ้งเตือน (Automated Alerts)</h4>
             <div className="flex flex-col gap-2 text-xs text-slate-500">
               <div className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>Daily Check Fail (Instant)</div>
               <div className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>PM 7 Days Notice (Active)</div>
             </div>
          </div>
        </div>
      </div>

       {/* Request Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <AlertOctagon className="w-6 h-6 mr-2 text-red-500" /> แจ้งซ่อม (Repair Request)
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">อุปกรณ์ที่ชำรุด *</label>
                        <select className="w-full border rounded-lg px-3 py-2 bg-white" required
                            value={request.assetId} onChange={handleAssetSelect}>
                            <option value="">-- เลือกอุปกรณ์ --</option>
                            {assets.map(a => <option key={a.id} value={a.id}>{a.name} - {a.id}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">วันที่แจ้ง</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2" 
                            value={request.requestDate} onChange={e => setRequest({...request, requestDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้แจ้ง</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="ชื่อ-นามสกุล"
                            value={request.technician} onChange={e => setRequest({...request, technician: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดอาการเสีย *</label>
                        <textarea className="w-full border rounded-lg px-3 py-2" rows={4} required placeholder="ระบุอาการอย่างละเอียด..."
                            value={request.description} onChange={e => setRequest({...request, description: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">แนบไฟล์รายงาน (PDF) - Optional</label>
                         <input 
                            type="file" 
                            accept="application/pdf"
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            onChange={handleFileChange}
                         />
                         <p className="text-xs text-slate-400 mt-1">อัปโหลดไฟล์ PDF ใบแจ้งซ่อม หรือ รายงาน PM</p>
                    </div>
                    
                    <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium">
                        ส่งแจ้งซ่อม
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
