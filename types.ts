
export enum PatientStatus {
  WAITING = '待检查',
  COMPLETED = '已完成',
  IN_PROGRESS = '进行中',
  APPOINTMENT = '预约'
}

export enum TreatmentType {
  INITIAL = '初诊',
  FOLLOW_UP = '复诊'
}

export interface TreatmentRecord {
  id: string;
  date: string;
  time: string;
  toothPos: string;
  desc: string;
  imageUrl?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  cardNumber?: string;
  age?: string;
  gender?: '男' | '女';
  visitDate?: string;
  avatar?: string;
  status: PatientStatus;
  treatmentType: TreatmentType;
  time: string;
  desc: string;
  toothPos?: string;
  imageUrl?: string;
  records?: TreatmentRecord[];
}

export interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  type: string;
  time: string;
  status: 'booked' | 'free' | 'break';
}

export type Quadrant = 'UR' | 'UL' | 'LR' | 'LL';

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  expiryDate: string;
  stock: number;
  unit: string;
  minStock: number;
  category: '麻醉' | '填充' | '消毒' | '耗材' | '其他';
  status: 'normal' | 'expired' | 'warning';
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  isCustom: boolean;
  addedDate: string;
  isBought: boolean;
}
