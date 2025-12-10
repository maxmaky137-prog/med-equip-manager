
import { Asset, CheckRecord, MaintenanceRecord, LoanRecord, AssetStatus } from '../types';
import { MOCK_ASSETS, MOCK_CHECKS, MOCK_MAINTENANCE, MOCK_LOANS } from './mockData';

// Helper to get API URL and Settings
const getSettings = () => {
  const settingsStr = localStorage.getItem('medEquipSettings');
  if (settingsStr) {
    return JSON.parse(settingsStr);
  }
  return null;
};

// If API URL exists in settings, use it. Otherwise use LocalStorage.
const useApi = () => {
  const settings = getSettings();
  // We repurpose a field or assume the user adds it to the settings object logic later. 
  // For now, let's look for a specific key in local storage or the settings object.
  // Ideally, add a field 'googleScriptUrl' in settings.
  return settings?.googleScriptUrl && settings.googleScriptUrl.startsWith('https://');
};

const getApiUrl = () => {
  return getSettings()?.googleScriptUrl;
}

// --- Telegram Logic ---
const sendTelegramMessage = async (message: string) => {
  const settings = getSettings();
  if (!settings?.telegramBotToken || !settings?.telegramChatId) {
    console.warn('Telegram Notification Skipped: Missing config.');
    return;
  }

  try {
    // Check if we are checking upcoming PMs (batch job) to avoid spamming or context issues
    // Just simple fetch
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Telegram Error:', error);
  }
};

// --- Google Sheets API Helper ---
const apiFetch = async (sheetName: string) => {
  const url = `${getApiUrl()}?sheet=${sheetName}`;
  const res = await fetch(url);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
};

const apiPost = async (sheetName: string, action: 'add' | 'update', data: any) => {
  const url = getApiUrl();
  await fetch(url!, {
    method: 'POST',
    mode: 'no-cors', // Google Apps Script Web App simple trigger often needs no-cors for simple post from browser
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheet: sheetName, action, data })
  });
  // Note: no-cors means we can't read the response, so we assume success for UI optimism
  return data;
};

// Simulation of async operations for local mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DataService = {
  getAssets: async (): Promise<Asset[]> => {
    if (useApi()) {
      try { return await apiFetch('Assets'); } catch (e) { console.error(e); return []; }
    }
    await delay(300);
    const stored = localStorage.getItem('ME_Assets');
    return stored ? JSON.parse(stored) : [...MOCK_ASSETS];
  },

  addAsset: async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
    const newAsset = { 
        ...asset, 
        id: `EQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` 
    };

    if (useApi()) {
      await apiPost('Assets', 'add', newAsset);
      return newAsset;
    }
    
    await delay(300);
    const currentAssets = await DataService.getAssets();
    const updatedAssets = [newAsset, ...currentAssets];
    localStorage.setItem('ME_Assets', JSON.stringify(updatedAssets));
    return newAsset;
  },

  getChecks: async (): Promise<CheckRecord[]> => {
    if (useApi()) {
      try { return await apiFetch('Checks'); } catch (e) { return []; }
    }
    await delay(300);
    const stored = localStorage.getItem('ME_Checks');
    return stored ? JSON.parse(stored) : [...MOCK_CHECKS];
  },

  addCheck: async (check: Omit<CheckRecord, 'id'>): Promise<CheckRecord> => {
    const newCheck = { ...check, id: `CHK-${Math.floor(Math.random() * 10000)}` };

    if (useApi()) {
      await apiPost('Checks', 'add', newCheck);
    } else {
      await delay(300);
      const currentChecks = await DataService.getChecks();
      localStorage.setItem('ME_Checks', JSON.stringify([newCheck, ...currentChecks]));
    }
    
    // Telegram Alert Logic
    if (check.status === 'Fail') {
      let issues = '';
      if (check.checklistDetails) {
         if (!check.checklistDetails.powerCord) issues += `- สายไฟ: ${check.checklistDetails.powerCordNote || 'ผิดปกติ'}\n`;
         if (!check.checklistDetails.screen) issues += `- หน้าจอ: ${check.checklistDetails.screenNote || 'ผิดปกติ'}\n`;
         if (!check.checklistDetails.functionality) issues += `- การทำงาน: ${check.checklistDetails.functionalityNote || 'ผิดปกติ'}\n`;
         if (!check.checklistDetails.cleanliness) issues += `- ความสะอาด: ${check.checklistDetails.cleanlinessNote || 'ผิดปกติ'}\n`;
      }

      const msg = `🚨 <b>แจ้งเตือนความผิดปกติ (Daily Check Fail)</b>\n\n` +
                  `<b>อุปกรณ์:</b> ${check.assetName}\n` +
                  `<b>ผู้ตรวจ:</b> ${check.checkerName}\n` +
                  `<b>วันที่:</b> ${check.date}\n` +
                  `----------------------------\n` +
                  `<b>จุดที่พบปัญหา:</b>\n${issues || '- ไม่ระบุ'}\n` +
                  `<b>สรุปเพิ่มเติม:</b> ${check.notes || '-'}`;
      await sendTelegramMessage(msg);
    }
    
    return newCheck;
  },

  getMaintenanceRecords: async (): Promise<MaintenanceRecord[]> => {
    if (useApi()) {
      try { return await apiFetch('Maintenance'); } catch (e) { return []; }
    }
    await delay(300);
    const stored = localStorage.getItem('ME_Maintenance');
    return stored ? JSON.parse(stored) : [...MOCK_MAINTENANCE];
  },

  addMaintenanceRequest: async (req: Omit<MaintenanceRecord, 'id' | 'status'>): Promise<MaintenanceRecord> => {
    const newReq: MaintenanceRecord = { 
        ...req, 
        id: `MT-${Math.floor(Math.random() * 10000)}`, 
        status: 'Pending' 
    };

    if (useApi()) {
      await apiPost('Maintenance', 'add', newReq);
      // Also update asset status
      const assets = await DataService.getAssets();
      const asset = assets.find(a => a.id === req.assetId);
      if (asset) {
        asset.status = AssetStatus.REPAIR;
        await apiPost('Assets', 'update', asset);
      }
    } else {
      await delay(300);
      const currentMaint = await DataService.getMaintenanceRecords();
      localStorage.setItem('ME_Maintenance', JSON.stringify([newReq, ...currentMaint]));
      
      const currentAssets = await DataService.getAssets();
      const assetIndex = currentAssets.findIndex(a => a.id === req.assetId);
      if (assetIndex > -1) {
          currentAssets[assetIndex].status = AssetStatus.REPAIR;
          localStorage.setItem('ME_Assets', JSON.stringify(currentAssets));
      }
    }

    const msg = `🛠 <b>แจ้งซ่อมใหม่ (New Maintenance Request)</b>\n\n` +
                `<b>อุปกรณ์:</b> ${req.assetName}\n` +
                `<b>ผู้แจ้ง:</b> ${req.technician}\n` +
                `<b>อาการเสีย:</b> ${req.description}\n` +
                `<b>เอกสารแนบ:</b> ${req.attachmentUrl ? 'มีไฟล์แนบ' : '-'}\n` +
                `<b>ความเร่งด่วน:</b> สูง`;
    await sendTelegramMessage(msg);

    return newReq;
  },

  getLoans: async (): Promise<LoanRecord[]> => {
    if (useApi()) {
      try { return await apiFetch('Loans'); } catch (e) { return []; }
    }
    await delay(300);
    const stored = localStorage.getItem('ME_Loans');
    return stored ? JSON.parse(stored) : [...MOCK_LOANS];
  },
  
  createLoan: async (loan: Omit<LoanRecord, 'id' | 'status'>): Promise<LoanRecord> => {
    const newLoan: LoanRecord = { ...loan, id: `LN-${Math.floor(Math.random() * 10000)}`, status: 'Active' };
    
    if (useApi()) {
      await apiPost('Loans', 'add', newLoan);
      const assets = await DataService.getAssets();
      const asset = assets.find(a => a.id === loan.assetId);
      if (asset) {
        asset.status = AssetStatus.LOANED;
        await apiPost('Assets', 'update', asset);
      }
    } else {
      await delay(300);
      const currentLoans = await DataService.getLoans();
      localStorage.setItem('ME_Loans', JSON.stringify([newLoan, ...currentLoans]));

      const currentAssets = await DataService.getAssets();
      const assetIndex = currentAssets.findIndex(a => a.id === loan.assetId);
      if (assetIndex > -1) {
          currentAssets[assetIndex].status = AssetStatus.LOANED;
          localStorage.setItem('ME_Assets', JSON.stringify(currentAssets));
      }
    }

    return newLoan;
  },

  returnLoan: async (loanId: string, returnDate: string): Promise<void> => {
    const loans = await DataService.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (loan) {
        loan.status = 'Returned';
        loan.returnDate = returnDate;

        if (useApi()) {
           await apiPost('Loans', 'update', loan);
           const assets = await DataService.getAssets();
           const asset = assets.find(a => a.id === loan.assetId);
           if (asset) {
             asset.status = AssetStatus.ACTIVE;
             await apiPost('Assets', 'update', asset);
           }
        } else {
           // Local Logic
           const allLoans = await DataService.getLoans();
           const idx = allLoans.findIndex(l => l.id === loanId);
           if (idx > -1) {
             allLoans[idx] = loan;
             localStorage.setItem('ME_Loans', JSON.stringify(allLoans));
           }
           
           const currentAssets = await DataService.getAssets();
           const assetIndex = currentAssets.findIndex(a => a.id === loan.assetId);
           if (assetIndex > -1) {
               currentAssets[assetIndex].status = AssetStatus.ACTIVE;
               localStorage.setItem('ME_Assets', JSON.stringify(currentAssets));
           }
        }
    }
  },

  checkUpcomingPMs: async (): Promise<number> => {
      // Logic remains mostly the same, fetching assets via getAssets() handles the source
      const assets = await DataService.getAssets();
      const today = new Date();
      let alertCount = 0;

      for (const asset of assets) {
          if (asset.nextPmDate) {
              const pmDate = new Date(asset.nextPmDate);
              const diffTime = pmDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays >= 0 && diffDays <= 7) {
                  const msg = `📅 <b>แจ้งเตือน PM ล่วงหน้า (Upcoming PM)</b>\n\n` +
                              `<b>อุปกรณ์:</b> ${asset.name} (${asset.id})\n` +
                              `<b>แผนก:</b> ${asset.department}\n` +
                              `<b>กำหนด PM:</b> ${asset.nextPmDate} (อีก ${diffDays} วัน)\n` +
                              `กรุณาเตรียมแผนการบำรุงรักษา`;
                  await sendTelegramMessage(msg);
                  alertCount++;
              }
          }
      }
      return alertCount;
  },

  exportAllData: async (): Promise<string> => {
      const data = {
          assets: await DataService.getAssets(),
          checks: await DataService.getChecks(),
          maintenance: await DataService.getMaintenanceRecords(),
          loans: await DataService.getLoans(),
          timestamp: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
  },

  importData: async (jsonString: string): Promise<boolean> => {
      try {
          const data = JSON.parse(jsonString);
          if (useApi()) {
            // Import to Google Sheets is complex via bulk, 
            // for now warn user or handle one by one (omitted for safety)
            alert("Import is only supported in Offline Mode currently.");
            return false;
          }
          
          if (data.assets) localStorage.setItem('ME_Assets', JSON.stringify(data.assets));
          if (data.checks) localStorage.setItem('ME_Checks', JSON.stringify(data.checks));
          if (data.maintenance) localStorage.setItem('ME_Maintenance', JSON.stringify(data.maintenance));
          if (data.loans) localStorage.setItem('ME_Loans', JSON.stringify(data.loans));
          return true;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  }
};
