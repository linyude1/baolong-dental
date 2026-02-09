
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../App';
import { formatToothPos } from '../constants';

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const [query, setQuery] = useState('');
  
  const filtered = patients.filter(p => p.name.includes(query) || p.phone.includes(query));

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-2">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="size-12 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">过往病例查询</h2>
          <div className="w-12"></div>
        </div>
        <div className="px-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input 
              className="form-input block w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50 text-base" 
              placeholder="输入姓名或手机号查询"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pb-8">
        <div className="px-4 pb-2 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">最近记录</h3>
        </div>

        <div className="flex flex-col gap-4 p-4 pt-2">
          {filtered.map((p) => (
            <div 
              key={p.id} 
              onClick={() => navigate(`/cases/${p.id}`)}
              className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-primary text-xl font-bold">{p.name}</p>
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                      {p.treatmentType}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {p.visitDate}
                  </p>
                </div>
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-600">
                  {p.avatar ? (
                    <img src={p.avatar} className="w-full h-full object-cover" alt="Case thumbnail" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-300">image</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-400">牙位:</span>
                  <span className="text-primary font-bold">{formatToothPos(p.toothPos)}</span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                  “{p.desc}”
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button className="flex items-center justify-center rounded-xl h-10 px-5 bg-primary text-white gap-2 text-sm font-bold transition-transform active:scale-95 shadow-md shadow-primary/20">
                  <span>查看详情</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
              <p className="font-medium">未找到匹配的病历记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
