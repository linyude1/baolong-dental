
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Appointments } from './pages/Appointments';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { AddCase } from './pages/AddCase';
import { Profile } from './pages/Profile';
import { MedicineInventory } from './pages/MedicineInventory';
import { patientsApi } from './services/api';
import { Patient } from './types';

// --- i18n Support ---
type Language = 'zh' | 'en';

const translations = {
  zh: {
    home: '首页',
    appointments: '预约',
    cases: '病例',
    profile: '我的',
    settings: '设置',
    language: '语言设置',
    logout: '退出登录',
    version: '版本号',
    clinicName: '宝龙口腔',
    drName: '王医生',
    role: '主治医师'
  },
  en: {
    home: 'Home',
    appointments: 'Schedule',
    cases: 'Cases',
    profile: 'Profile',
    settings: 'Settings',
    language: 'Language',
    logout: 'Log Out',
    version: 'Version',
    clinicName: 'DentalPro Clinic',
    drName: 'Dr. Wang',
    role: 'Chief Dentist'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['zh']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

// --- Patient State Management ---
interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatients must be used within a PatientProvider');
  return context;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  // 识别需要隐藏底部导航栏的页面
  const hideTabs = ['/add-case', '/medicine'].includes(location.pathname) || location.pathname.startsWith('/cases/');

  return (
    <Layout showTabBar={!hideTabs}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:caseId" element={<CaseDetail />} />
        <Route path="/add-case" element={<AddCase />} />
        <Route path="/medicine" element={<MedicineInventory />} />
        <Route path="/profile" element={<Profile />} />
        {/* 兜底路由：匹配不到时返回首页，防止黑屏 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [language, setLanguage] = useState<Language>('zh');
  const [loading, setLoading] = useState(true);

  // 从数据库加载患者数据
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await patientsApi.getAll();
        setPatients(data);
      } catch (error) {
        console.error('加载患者数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, []);

  const patientValue = useMemo(() => ({
    patients,
    addPatient: async (newP: Patient) => {
      try {
        const created = await patientsApi.create(newP);
        setPatients(prev => [created, ...prev]);
      } catch (error) {
        console.error('创建患者失败:', error);
        throw error;
      }
    },
    updatePatient: async (updatedP: Patient) => {
      try {
        await patientsApi.update(updatedP.id, updatedP);
        setPatients(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
      } catch (error) {
        console.error('更新患者失败:', error);
        throw error;
      }
    },
    deletePatient: async (id: string) => {
      try {
        await patientsApi.delete(id);
        setPatients(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('删除患者失败:', error);
        throw error;
      }
    },
  }), [patients]);

  const langValue = useMemo(() => ({
    language,
    setLanguage,
    t: (key: keyof typeof translations['zh']) => translations[language][key] || key
  }), [language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={langValue}>
      <PatientContext.Provider value={patientValue}>
        <Router>
          <AppContent />
        </Router>
      </PatientContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;
