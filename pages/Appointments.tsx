
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../types';
import { appointmentsApi } from '../services/api';

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await appointmentsApi.getAll();
        setAppointments(data);
      } catch (err) {
        console.error('加载预约失败:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-2 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="size-12 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold">预约管理</h2>
          <button className="size-12 flex items-center justify-center rounded-full text-slate-400">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {['周一', '周二', '周三', '周四', '周五', '周六'].map((day, idx) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <span className={`text-xs ${idx === 1 ? 'text-primary font-bold' : 'text-slate-400 font-medium'}`}>{day}</span>
                <div className={`w-12 h-16 flex flex-col items-center justify-center rounded-2xl shadow-sm ${idx === 1 ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800'}`}>
                  <span className="text-lg font-bold">{23 + idx}</span>
                  {idx === 1 && <div className="w-1 h-1 bg-white rounded-full mt-1"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">获取预约中...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
            <p className="text-sm font-bold">暂无预约记录</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="flex gap-4">
              <div className="w-12 flex flex-col items-center">
                <span className="text-sm font-bold">{apt.time}</span>
                <div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
              </div>
              <div className="flex-1 pb-4">
                {apt.status === 'booked' ? (
                  <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{apt.patientName}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold">{apt.type}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">phone_iphone</span>
                        {apt.phone}
                      </p>
                    </div>
                    <button className="size-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm text-primary">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  </div>
                ) : apt.status === 'break' ? (
                  <div className="flex items-center gap-4 opacity-50 py-2">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-xs font-medium">午休</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-400 font-medium">空闲时段</span>
                    <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg">预约</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
