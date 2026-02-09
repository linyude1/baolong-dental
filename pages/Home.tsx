
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../App';
import { PatientStatus, TreatmentType, Patient } from '../types';
import { formatToothPos } from '../constants';
import { medicinesApi } from '../services/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { patients, updatePatient } = usePatients();

  const getLocalDate = () => {
    const d = new Date();
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
  };

  const today = getLocalDate();

  const [selectedDate, setSelectedDate] = useState<number | null>(today.day);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.year, today.month, 1));
  const [searchQuery, setSearchQuery] = useState('');
  const [isYearMonthModalOpen, setIsYearMonthModalOpen] = useState(false);
  const [hasInventoryWarning, setHasInventoryWarning] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const monthName = currentMonth.toLocaleString('zh-CN', { year: 'numeric', month: 'long' });

  // Fix: Calculate the days for the selected month to be displayed in the horizontal scroller
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const isToday = d === today.day && month === today.month && year === today.year;
      const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', '');
      days.push({
        date: d,
        day: dayName,
        isToday
      });
    }
    return days;
  }, [currentMonth, today]);

  useEffect(() => {
    if (selectedDate && itemRefs.current[selectedDate] && scrollRef.current) {
      setTimeout(() => {
        itemRefs.current[selectedDate]?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }, 100);
    }
  }, [selectedDate, currentMonth]);

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newMonth);
    const isThisMonth = newMonth.getMonth() === today.month && newMonth.getFullYear() === today.year;
    setSelectedDate(isThisMonth ? today.day : 1);
  };

  useEffect(() => {
    const checkInventory = async () => {
      try {
        const medicines = await medicinesApi.getAll();
        setHasInventoryWarning(medicines.some(m => m.status === 'expired' || m.status === 'warning'));
      } catch (err) {
        console.error('检查库存失败:', err);
      }
    };
    checkInventory();
  }, []);

  // 核心修改：重新定义“就诊项”
  const filteredVisits = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const day = selectedDate ? String(selectedDate).padStart(2, '0') : null;
    const targetDateStr = day ? `${year}-${month}-${day}` : `${year}-${month}`;

    const visits: { patient: Patient; displayTime: string; displayDesc: string; displayTooth: string; isCompleted: boolean }[] = [];

    patients.forEach(p => {
      // 检查搜索匹配
      const matchesSearch = p.name.includes(searchQuery) || (p.phone && p.phone.includes(searchQuery));
      if (!matchesSearch) return;

      if (selectedDate === null) {
        // 月视图：如果患者本月有任何记录或 visitDate 在本月
        const hasRecordsInMonth = p.records?.some(r => r.date.startsWith(targetDateStr));
        if (p.visitDate?.startsWith(targetDateStr) || hasRecordsInMonth) {
          visits.push({
            patient: p,
            displayTime: p.time,
            displayDesc: p.desc,
            displayTooth: p.toothPos || '全口',
            isCompleted: p.status === PatientStatus.COMPLETED
          });
        }
      } else {
        // 日视图：精准匹配日期
        // 1. 检查主就诊日期
        if (p.visitDate === targetDateStr) {
          visits.push({
            patient: p,
            displayTime: p.time,
            displayDesc: p.desc,
            displayTooth: p.toothPos || '全口',
            isCompleted: p.status === PatientStatus.COMPLETED
          });
        }
        // 2. 检查历史病历中是否也有该日期的记录（避免重复添加）
        else {
          const recordOnDate = p.records?.find(r => r.date === targetDateStr);
          if (recordOnDate) {
            visits.push({
              patient: p,
              displayTime: recordOnDate.time,
              displayDesc: recordOnDate.desc,
              displayTooth: recordOnDate.toothPos,
              isCompleted: true // 历史记录默认视为已完成
            });
          }
        }
      }
    });

    return visits.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return a.displayTime.localeCompare(b.displayTime);
    });
  }, [searchQuery, patients, selectedDate, currentMonth]);

  const togglePatientStatus = (e: React.MouseEvent, p: Patient) => {
    e.stopPropagation();
    const newStatus = p.status === PatientStatus.COMPLETED ? PatientStatus.WAITING : PatientStatus.COMPLETED;
    updatePatient({ ...p, status: newStatus });
  };

  return (
    <div className="flex flex-col relative pb-20">
      <header className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/medicine')} className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">menu</span>
            </button>

            <div className="flex items-center gap-1">
              <button onClick={() => changeMonth(-1)} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">chevron_left</span>
              </button>
              <div
                className="flex items-center gap-1 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition-transform"
                onClick={() => setIsYearMonthModalOpen(true)}
              >
                <h2 className="text-sm font-black text-primary">{monthName}</h2>
                <span className="material-symbols-outlined text-lg text-primary">keyboard_arrow_down</span>
              </div>
              <button onClick={() => changeMonth(1)} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => navigate('/medicine')}
              className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">notifications</span>
              {hasInventoryWarning && (
                <span className="absolute top-2 right-2 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
              )}
            </button>
          </div>

          <div ref={scrollRef} className="flex overflow-x-auto gap-3 hide-scrollbar pb-2 snap-x px-1 scroll-smooth">
            <button
              onClick={() => setSelectedDate(null)}
              className={`flex flex-col items-center justify-center min-w-[62px] h-20 rounded-2xl border transition-all snap-center ${selectedDate === null ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600'}`}
            >
              <span className={`text-[10px] font-bold mb-1 ${selectedDate === null ? 'text-white/80' : 'text-slate-400'}`}>本月</span>
              <span className="material-symbols-outlined text-2xl font-black">calendar_view_month</span>
            </button>

            {daysInMonth.map((d) => (
              <button
                key={d.date}
                ref={el => itemRefs.current[d.date] = el}
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center justify-center min-w-[62px] h-20 rounded-2xl border transition-all snap-center ${selectedDate === d.date ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600'}`}
              >
                <span className={`text-[10px] font-bold mb-1 ${selectedDate === d.date ? 'text-white/80' : 'text-slate-400'}`}>{d.day}</span>
                <span className="text-xl font-black">{d.date}</span>
                {d.isToday && <div className={`mt-1 w-1 h-1 rounded-full ${selectedDate === d.date ? 'bg-white' : 'bg-primary'}`}></div>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            className="block w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 text-sm"
            placeholder="搜索患者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/add-case', { state: { treatmentType: TreatmentType.INITIAL } })} className="h-16 bg-white dark:bg-slate-800 text-primary border border-primary/20 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm">
            <span className="material-symbols-outlined">person_add</span>首次就诊
          </button>
          <button onClick={() => navigate('/cases')} className="h-16 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">history</span>复诊查询
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-black">就诊名单 ({filteredVisits.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-md">
              {selectedDate === null ? '本月' : `${currentMonth.getMonth() + 1}月${selectedDate}日`} 共:{filteredVisits.length}人
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {filteredVisits.map((visit, index) => (
            <div
              key={`${visit.patient.id}-${visit.displayTime}`}
              onClick={() => navigate(`/cases/${visit.patient.id}`)}
              className={`bg-white dark:bg-slate-800 p-4 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-700/50 active:scale-[0.98] transition-all cursor-pointer flex gap-4 relative overflow-hidden ${visit.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className="absolute top-0 left-0 bg-primary/10 text-primary px-3 py-1 rounded-br-2xl text-[10px] font-black flex items-center gap-1">
                <span>#{index + 1}</span>
                {visit.patient.cardNumber && (
                  <>
                    <span className="opacity-30">|</span>
                    <span className="text-primary/70 font-bold">排队卡:{visit.patient.cardNumber}</span>
                  </>
                )}
              </div>

              <img src={visit.patient.avatar} className="size-16 rounded-2xl object-cover mt-2" alt={visit.patient.name} />
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-lg font-bold truncate">{visit.patient.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400">{visit.displayTime}</span>
                </div>

                <p className="text-[13px] font-bold text-slate-500 mb-2 truncate">
                  {visit.displayDesc || '常规口腔检查'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] font-black rounded-md">{visit.patient.treatmentType}</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-md border border-slate-100">{formatToothPos(visit.displayTooth)}</span>
                  </div>

                  <button
                    onClick={(e) => togglePatientStatus(e, visit.patient)}
                    className={`h-8 px-4 rounded-full text-[11px] font-black transition-all flex items-center gap-1 ${visit.isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-primary/10 text-primary border border-primary/20 active:bg-primary active:text-white'}`}
                  >
                    {visit.isCompleted ? (
                      <><span className="material-symbols-outlined text-[16px]">check_circle</span>完成</>
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">pending_actions</span>待检</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredVisits.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_available</span>
              <p className="text-sm font-bold">该时段暂无就诊安排</p>
            </div>
          )}
        </div>
      </div>

      {isYearMonthModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsYearMonthModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6 text-center">跳转至月份</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">年份</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  value={currentMonth.getFullYear()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setFullYear(parseInt(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">月份</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  value={currentMonth.getMonth()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(parseInt(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{i + 1}月</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setIsYearMonthModalOpen(false)}
              className="w-full h-16 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 active:scale-95 transition-all"
            >
              确定跳转
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
