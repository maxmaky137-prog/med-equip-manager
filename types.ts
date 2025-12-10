
export enum AssetStatus {
  ACTIVE = 'Active',
  REPAIR = 'Under Repair',
  LOANED = 'Loaned Out',
  DISPOSED = 'Disposed',
  MAINTENANCE_DUE = 'PM Due'
}

export enum MaintenanceType {
  PM = 'Preventive Maintenance',
  CM = 'Corrective Maintenance (Repair)'
}

export interface Asset {
  id: string;
  name: string;
  model: string;
  brand: string;
  serialNumber: string;
  department: string;
  purchaseDate: string;
  price: number;
  status: AssetStatus;
  nextPmDate: string;
  image?: string;
  manualUrl?: string; // Link to PDF or Document
  googleDriveUrl?: string; // Link to Google Drive Folder
}

export interface CheckItem {
  name: string;
  status: 'Normal' | 'Abnormal';
}

export interface CheckRecord {
  id: string;
  assetId: string;
  assetName: string;
  date: string;
  checkerName: string;
  type: 'Daily' | 'Periodic';
  status: 'Pass' | 'Fail';
  notes?: string;
  checklistDetails?: { 
    powerCord: boolean; // true = Normal, false = Abnormal
    powerCordNote?: string; // Reason if abnormal
    screen: boolean;
    screenNote?: string;
    functionality: boolean;
    functionalityNote?: string;
    cleanliness: boolean;
    cleanlinessNote?: string;
  };
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  type: MaintenanceType;
  requestDate: string;
  completionDate?: string;
  technician: string;
  cost: number;
  description: string;
  partsReplaced?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  attachmentUrl?: string; // New field for PM Report PDF
}

export interface LoanRecord {
  id: string;
  assetId: string;
  assetName: string;
  borrowerName: string;
  department: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue';
}

// Chart Data Types
export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

// App Settings Type
export interface AppSettings {
  hospitalName: string;
  logoUrl: string;
  backgroundUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  googleScriptUrl?: string;
  departments?: string[]; // Dynamic Department List
}
