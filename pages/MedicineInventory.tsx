
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Medicine, ShoppingItem } from '../types';
import { medicinesApi, shoppingApi } from '../services/api';

export const MedicineInventory: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'expiry' | 'inventory' | 'shopping'>('expiry');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });
  const [newMedicine, setNewMedicine] = useState<Partial<Medicine>>({
    name: '',
    brand: '',
    expiryDate: '',
    stock: 0,
    unit: '盒',
    minStock: 5,
    category: '其他'
  });

  // 加载数据
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [meds, shop] = await Promise.all([
          medicinesApi.getAll(),
          shoppingApi.getAll()
        ]);
        setMedicines(meds);
        setShoppingItems(shop);
      } catch (err) {
        console.error('加载库存数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const expiredCount = medicines.filter(m => m.status === 'expired').length;
  const warningCount = medicines.filter(m => m.status === 'warning').length;

  const handleAddShoppingItem = async () => {
    if (!newItem.name || !newItem.quantity) return;
    try {
      const item = await shoppingApi.create({
        name: newItem.name,
        quantity: newItem.quantity,
        isCustom: true,
        addedDate: new Date().toISOString().split('T')[0],
        isBought: false
      });
      setShoppingItems([item, ...shoppingItems]);
      setNewItem({ name: '', quantity: '' });
      setIsShoppingModalOpen(false);
    } catch (err) {
      alert('添加采购项失败');
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.expiryDate) return;

    try {
      const medicine = await medicinesApi.create({
        name: newMedicine.name || '',
        brand: newMedicine.brand || '未知',
        expiryDate: newMedicine.expiryDate || '',
        stock: Number(newMedicine.stock) || 0,
        unit: newMedicine.unit || '盒',
        minStock: Number(newMedicine.minStock) || 5,
        category: (newMedicine.category as any) || '其他',
        status: 'normal' // 后端会自动计算
      });

      setMedicines([medicine, ...medicines]);
      setNewMedicine({ name: '', brand: '', expiryDate: '', stock: 0, unit: '盒', minStock: 5, category: '其他' });
      setIsMedicineModalOpen(false);
    } catch (err) {
      alert('入库失败');
    }
  };

  const toggleBought = async (id: string, currentStatus: boolean) => {
    try {
      await shoppingApi.update(id, { isBought: !currentStatus });
      setShoppingItems(items => items.map(item =>
        item.id === id ? { ...item, isBought: !currentStatus } : item
      ));
    } catch (err) {
      alert('更新状态失败');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-[150] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-2">
        <div className="flex items-center h-14 px-2">
          <button
            onClick={() => navigate(-1)}
            className="size-12 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all text-slate-800 dark:text-slate-100 z-[160]"
          >
            <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">医疗物资管理</h2>
          </div>
          <button
            onClick={() => setIsMedicineModalOpen(true)}
            className="size-10 ml-auto flex items-center justify-center rounded-xl bg-primary/10 text-primary active:scale-90 transition-all z-[170]"
          >
            <span className="material-symbols-outlined font-black">add</span>
          </button>
        </div>

        <div className="mt-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex relative overflow-hidden">
          <button
            onClick={() => setActiveTab('expiry')}
            className={`flex-1 py-2.5 text-center text-[10px] font-black rounded-xl transition-all z-10 ${activeTab === 'expiry' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
          >
            预警 ({expiredCount + warningCount})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2.5 text-center text-[10px] font-black rounded-xl transition-all z-10 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
          >
            全部库存
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 py-2.5 text-center text-[10px] font-black rounded-xl transition-all z-10 ${activeTab === 'shopping' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
          >
            采购单
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="flex-1 p-4 pb-24 relative">

          {(activeTab === 'expiry' || activeTab === 'inventory') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 mb-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {activeTab === 'expiry' ? '临期或过期药品' : '所有录入库存'}
                </h3>
              </div>
              {medicines
                .filter(m => activeTab === 'inventory' || m.status !== 'normal')
                .map(m => (
                  <div key={m.id} className={`bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 ${m.status === 'expired' ? 'border-l-4 border-l-red-500' : m.status === 'warning' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-primary/30'}`}>
                    <div className={`size-14 rounded-2xl flex items-center justify-center ${m.status === 'expired' ? 'bg-red-50 text-red-500' : m.status === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-primary/5 text-primary'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {m.status === 'expired' ? 'error' : m.status === 'warning' ? 'notification_important' : 'inventory_2'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm truncate max-w-[120px]">{m.name}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.status === 'expired' ? 'bg-red-500 text-white' : m.status === 'warning' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                          {m.status === 'expired' ? '已过期' : m.status === 'warning' ? '临期' : '正常'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{m.brand} · {m.category}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="material-symbols-outlined text-[12px]">event</span>
                          <span className="text-[10px] font-black">{m.expiryDate}</span>
                        </div>
                        <p className="text-[10px] font-black">库存: <span className={m.stock < m.minStock ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}>{m.stock} {m.unit}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'shopping' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待采购项目</h3>
                {/* 增强按钮点击反馈 */}
                <button
                  onClick={() => setIsShoppingModalOpen(true)}
                  className="text-[10px] font-black text-primary flex items-center gap-1 bg-primary/10 px-4 py-2 rounded-full active:scale-90 transition-all shadow-sm z-[160] relative"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  手动添加
                </button>
              </div>

              {shoppingItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleBought(item.id, item.isBought)}
                  className={`group bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all ${item.isBought ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.isBought ? 'bg-green-500 border-green-500' : 'border-slate-200 dark:border-slate-600'}`}>
                    {item.isBought && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-black text-slate-800 dark:text-slate-100 text-sm ${item.isBought ? 'line-through' : ''}`}>{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.quantity} · {item.isCustom ? '自定义' : '系统预警'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}


      {/* 采购单手动添加 Modal - 调高层级 z-index */}
      {isShoppingModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsShoppingModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6 text-center">手动添加采购项</h3>
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">物品名称</p>
                <input
                  autoFocus
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  placeholder="如: 高速涡轮机芯"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">预购数量/规格</p>
                <input
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  placeholder="如: 2个"
                  value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsShoppingModalOpen(false)} className="flex-1 h-14 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl font-black active:scale-95 transition-all">取消</button>
              <button onClick={handleAddShoppingItem} className="flex-1 h-14 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 active:scale-95 transition-all">确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 入库 Modal - 同步调高层级 */}
      {isMedicineModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsMedicineModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[44px] sm:rounded-[44px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-black mb-1">录入库存药品</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">请务必核对有效期及批号</p>

            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">药品/材料名称</p>
                <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20" placeholder="请输入全名" value={newMedicine.name} onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">品牌</p>
                  <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black" placeholder="如: 3M" value={newMedicine.brand} onChange={e => setNewMedicine({ ...newMedicine, brand: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">分类</p>
                  <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black" value={newMedicine.category} onChange={e => setNewMedicine({ ...newMedicine, category: e.target.value as any })} >
                    <option value="麻醉">麻醉</option><option value="填充">填充</option><option value="消毒">消毒</option><option value="耗材">耗材</option><option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">有效期至 (过期时间)</p>
                <input type="date" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black text-primary" value={newMedicine.expiryDate} onChange={e => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsMedicineModalOpen(false)} className="h-16 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black">取消</button>
              <button onClick={handleAddMedicine} className="h-16 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20">确认入库</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
