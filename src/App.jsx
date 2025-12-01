import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Shuffle, Shirt, Search, X, Save, RefreshCw, 
  ShoppingBag, Camera, ArrowRight, Loader2, Sparkles, 
  Thermometer, MapPin, Hash, Star, Briefcase, 
  Wind, CloudRain, Sun, Cloud, LayoutGrid, ListFilter, Check, Tag, FileText, TrendingUp, Store, Minus, ChevronDown, Download, Upload, ChevronRight, BarChart3
} from 'lucide-react';

// --- 版本設定 ---
const APP_VERSION = 'v6.7.2';

// --- 全域樣式與字體設定 ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700&display=swap');
    
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%; 
      overflow: hidden; 
      -webkit-font-smoothing: antialiased;
      background-color: #ffffff;
    }
    
    #root {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      background-color: #ffffff;
    }

    .font-serif {
      font-family: 'Noto Serif TC', 'Songti TC', serif !important;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", "Noto Sans TC", "Microsoft JhengHei", monospace !important;
    }
    
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
    .pb-safe {
      padding-bottom: calc(env(safe-area-inset-bottom) + 2rem);
    }
    .pt-safe-header {
      padding-top: max(1rem, env(safe-area-inset-top));
    }
    
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .modal-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}</style>
);

// --- IndexedDB 工具 ---
const DB_NAME = 'WardrobeDB';
const DB_VERSION = 1;
const STORE_NAME = 'items';

const dbHelper = {
  open: () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  getAll: async () => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  save: async (item) => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  delete: async (id) => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  clear: async () => {
    const db = await dbHelper.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; 
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      };
    };
  });
};

// --- 資料結構與常數 ---
const CATEGORY_CN = {
  'TOPS': '上身', 'BOTTOMS': '下身', 'OUTER': '外套', 
  'DRESS': '洋裝', 'SHOES': '鞋子', 'ACCESSORY': '配件'
};

const THICKNESS_CN = {
  'THIN': '薄', 'MEDIUM': '適中', 'THICK': '厚', 'WARM': '保暖'
};

const STYLE_CN = {
  'CASUAL': '休閒', 'FORMAL': '正式', 'SPORT': '運動', 'PARTY': '派對', 'HOME': '居家'
};

const MATERIAL_CN = {
  'COTTON': '棉', 'POLYESTER': '聚酯纖維', 'WOOL': '羊毛', 'LINEN': '亞麻',
  'SILK': '絲', 'LEATHER': '皮革', 'DENIM': '牛仔', 'NYLON': '尼龍',
  'SPANDEX': '彈性纖維', 'RAYON': '人造絲', 'ACRYLIC': '壓克力纖維',
  'CASHMERE': '喀什米爾', 'OTHER': '其他'
};

const INITIAL_DATA = [
  { id: 'T01', name: 'WHITE T-SHIRT', category: 'TOPS', season: 'SUMMER', color: '#ffffff', image: '', material: 'COTTON 100%', thickness: 'THIN', style: 'CASUAL', rating: 5, purchaseDate: '2023-06-15', source: 'UNIQLO', price: 390, note: 'ESSENTIAL BASIC.' },
  { id: 'B01', name: 'DENIM WIDE LEG', category: 'BOTTOMS', season: 'ALL', color: '#3b82f6', image: '', material: 'COTTON 98% / SPANDEX 2%', thickness: 'MEDIUM', style: 'CASUAL', rating: 4, purchaseDate: 'unknown', source: 'GU', price: 590, note: '' },
];

const CATEGORY_CONFIG = [
    { label: 'TOPS', full: 'TOPS', code: 'T' },
    { label: 'BTM', full: 'BOTTOMS', code: 'B' },
    { label: 'OUT', full: 'OUTER', code: 'O' },
    { label: 'DRS', full: 'DRESS', code: 'D' },
    { label: 'SHO', full: 'SHOES', code: 'S' },
    { label: 'ACC', full: 'ACCESSORY', code: 'A' },
];

const THICKNESS_OPTIONS = ['THIN', 'MEDIUM', 'THICK', 'WARM'];
const STYLE_OPTIONS = ['CASUAL', 'FORMAL', 'SPORT', 'PARTY', 'HOME'];

const MATERIALS_LIST = [
    'COTTON', 'POLYESTER', 'WOOL', 'LINEN', 'SILK', 'LEATHER', 
    'DENIM', 'NYLON', 'SPANDEX', 'RAYON', 'ACRYLIC', 'CASHMERE', 'OTHER'
];

const TEMP_RANGES = [
    { label: '0-10°C', value: 'freezing' },
    { label: '10-20°C', value: 'cold' },
    { label: '20-30°C', value: 'warm' },
    { label: '30°C+', value: 'hot' },
];
const WEATHER_TAGS = ['SUNNY', 'CLOUDY', 'RAINY', 'WINDY', 'SNOWY'];
const SENSATION_TAGS = ['MUGGY', 'COMFY', 'COOL', 'CHILLY', 'DRY'];
const ENVIRONMENT_OPTIONS = ['INDOOR', 'OUTDOOR'];
const ACTIVITY_OPTIONS = ['ACTIVE', 'STATIC'];
const PURPOSE_TAGS = ['FORMAL', 'CASUAL', 'DATE', 'PARTY'];

const COLOR_PALETTE = [
    { name: 'Black', value: '#000000' }, { name: 'White', value: '#ffffff' },
    { name: 'Grey', value: '#808080' }, { name: 'Beige', value: '#F5F5DC' },
    { name: 'Camel', value: '#C19A6B' }, { name: 'Brown', value: '#5D4037' },
    { name: 'Navy', value: '#1565C0' }, { name: 'Sky', value: '#90CAF9' }, 
    { name: 'Green', value: '#2E7D32' }, { name: 'Mustard', value: '#FBC02D' },
    { name: 'Orange', value: '#E65100' }, { name: 'Burgundy', value: '#B71C1C' }, 
    { name: 'Pink', value: '#F48FB1' }, { name: 'Purple', value: '#6A1B9A' },
];

const parseMaterialString = (str) => {
    if (!str) return [{ name: '', percent: '' }];
    return str.split('/').map(part => {
        const match = part.trim().match(/^(.+?)\s*(\d+)?%?$/);
        return match ? { name: match[1].trim(), percent: match[2] || '' } : { name: part.trim(), percent: '' };
    });
};

const serializeMaterialRows = (rows) => {
    return rows.filter(r => r.name).map(r => `${r.name.toUpperCase()}${r.percent ? ' ' + r.percent + '%' : ''}`).join(' / ');
};

// --- Sub-Components ---

const Header = ({ rightAction }) => (
    <div className="bg-white px-6 pt-safe-header pb-4 flex justify-between items-end sticky top-0 z-40 bg-opacity-95 backdrop-blur-sm border-b border-gray-50 shadow-sm transition-all duration-300">
        <div className="flex items-baseline gap-3">
            <h1 className="text-3xl tracking-tighter font-serif font-bold text-black uppercase leading-none">MY WALK-IN CLOSET</h1>
            <span className="text-[10px] text-gray-400 font-mono tracking-widest">{APP_VERSION}</span>
        </div>
        {rightAction}
    </div>
);

const MaterialEditor = ({ materialString, onChange }) => {
    const [rows, setRows] = useState(parseMaterialString(materialString));

    useEffect(() => {
        const parsed = parseMaterialString(materialString);
        if (JSON.stringify(parsed) !== JSON.stringify(rows)) {
            setRows(parsed);
        }
    }, [materialString]);

    const updateRow = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
        onChange(serializeMaterialRows(newRows));
    };

    const addRow = () => {
        setRows([...rows, { name: '', percent: '' }]);
    };

    const removeRow = (index) => {
        const newRows = rows.filter((_, i) => i !== index);
        setRows(newRows.length ? newRows : [{ name: '', percent: '' }]);
        onChange(serializeMaterialRows(newRows.length ? newRows : [{ name: '', percent: '' }]));
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">MATERIAL</label>
            <div className="space-y-2">
                {rows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <select
                                className="w-full border-b border-gray-200 py-1 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none"
                                value={row.name}
                                onChange={(e) => updateRow(i, 'name', e.target.value)}
                            >
                                <option value="" disabled>SELECT MATERIAL</option>
                                {/* [v6.6] Display Chinese Translation */}
                                {MATERIALS_LIST.map(m => (
                                    <option key={m} value={m}>{m} ({MATERIAL_CN[m]})</option>
                                ))}
                            </select>
                            <div className="absolute right-0 top-1 pointer-events-none text-gray-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                        
                        <div className="flex items-center w-20 border-b border-gray-200">
                            <input 
                                type="number" 
                                className="w-full py-1 bg-transparent text-sm font-medium outline-none text-right rounded-none"
                                placeholder="100"
                                value={row.percent}
                                onChange={(e) => updateRow(i, 'percent', e.target.value)}
                            />
                            <span className="text-xs text-gray-400 ml-1">%</span>
                        </div>
                        <button type="button" onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addRow} className="flex items-center gap-1 text-[10px] font-bold text-black uppercase hover:opacity-50 mt-1 rounded-none">
                    <Plus size={10} /> ADD MATERIAL
                </button>
            </div>
        </div>
    );
};

const EditPage = ({ formData, setFormData, handleSaveItem, handleDelete, handleImageUpload, handleRemoveImage, editingItem, setView }) => (
    <div className="bg-white h-full flex flex-col font-mono animate-fade-in">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-40 pt-safe-header">
            <button onClick={() => setView('wardrobe')}><X size={24} className="text-black"/></button>
            <span className="font-serif font-bold text-lg tracking-wide uppercase">{editingItem ? 'EDITOR' : 'NEW ITEM'}</span>
            <button onClick={handleSaveItem} className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5 hover:opacity-50 rounded-none">SAVE</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-safe hide-scrollbar">
            <div className="flex gap-4 h-64">
                <div className="flex-1 relative bg-gray-50 flex flex-col items-center justify-center overflow-hidden border border-gray-100 group rounded-none">
                    {formData.image ? (
                        <>
                            <img src={formData.image} className="w-full h-full object-cover" alt="Main" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage('image'); }}
                                className="absolute top-2 right-2 bg-white/80 p-1 rounded-full shadow-sm z-10 hover:bg-white"
                            >
                                <X size={16} className="text-black" />
                            </button>
                        </>
                    ) : (
                        <div className="text-center">
                            <Camera size={24} className="mx-auto mb-2 text-gray-300"/>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">ADD PHOTO</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'image')} />
                </div>

                <div className="w-1/3 flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">COLOR</label>
                    <div className="flex-1 flex flex-wrap content-start gap-2 overflow-y-auto hide-scrollbar">
                        {COLOR_PALETTE.map(c => (
                            <button 
                                key={c.name}
                                onClick={() => setFormData({...formData, color: c.value})}
                                className={`w-8 h-8 rounded-sm border transition ${formData.color === c.value ? 'ring-2 ring-black ring-offset-2' : 'border-gray-200'}`}
                                style={{backgroundColor: c.value}}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="border-b border-black pb-2">
                    <input 
                      type="text" 
                      className="w-full text-xl font-bold placeholder-gray-200 outline-none bg-transparent uppercase rounded-none" 
                      placeholder="ITEM NAME" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <MaterialEditor 
                        materialString={formData.material} 
                        onChange={(newVal) => setFormData({...formData, material: newVal})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">CATEGORY</label>
                        <div className="relative">
                            <select 
                                className="w-full border-b border-gray-200 py-1 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none" 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                {/* [v6.6] Display Chinese Translation */}
                                {CATEGORY_CONFIG.map(c => <option key={c.full} value={c.full}>{c.full} ({CATEGORY_CN[c.full]})</option>)}
                            </select>
                            <div className="absolute right-0 top-1 pointer-events-none text-gray-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">RATING</label>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(star => (
                                <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})}>
                                    <Star size={16} className={star <= formData.rating ? "fill-black text-black" : "text-gray-200"} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">THICKNESS</label>
                            <div className="relative">
                                <select 
                                    className="w-full border-b border-gray-200 py-1 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none" 
                                    value={formData.thickness} 
                                    onChange={e => setFormData({...formData, thickness: e.target.value})}
                                >
                                    {/* [v6.6] Display Chinese Translation */}
                                    {THICKNESS_OPTIONS.map(t => <option key={t} value={t}>{t} ({THICKNESS_CN[t]})</option>)}
                                </select>
                                <div className="absolute right-0 top-1 pointer-events-none text-gray-400">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">STYLE</label>
                            <div className="relative">
                                <select 
                                    className="w-full border-b border-gray-200 py-1 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none" 
                                    value={formData.style || 'CASUAL'} 
                                    onChange={e => setFormData({...formData, style: e.target.value})}
                                >
                                    {/* [v6.6] Display Chinese Translation */}
                                    {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s} ({STYLE_CN[s]})</option>)}
                                </select>
                                <div className="absolute right-0 top-1 pointer-events-none text-gray-400">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-4">META DATA</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <input 
                          type="text" 
                          placeholder="BRAND / SOURCE" 
                          className="border-b border-gray-200 py-2 outline-none uppercase rounded-none" 
                          value={formData.source} 
                          onChange={e => setFormData({...formData, source: e.target.value})} 
                        />
                        <input 
                          type="number" 
                          placeholder="PRICE (NT$)" 
                          className="border-b border-gray-200 py-2 outline-none rounded-none" 
                          value={formData.price} 
                          onChange={e => setFormData({...formData, price: e.target.value})} 
                        />
                    </div>
                    <textarea 
                      className="w-full border-b border-gray-200 py-2 mt-4 text-sm outline-none resize-none h-20 placeholder-gray-300 rounded-none" 
                      placeholder="NOTES..." 
                      value={formData.note} 
                      onChange={e => setFormData({...formData, note: e.target.value})} 
                    />
                </div>

                {editingItem && (
                    <button onClick={() => handleDelete(editingItem.id)} className="w-full py-4 text-xs font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 transition rounded-none">
                        DELETE ITEM
                    </button>
                )}
            </div>
        </div>
    </div>
);

const WardrobePage = ({ items, activeCategory, setActiveCategory, resetForm, setView, openEdit }) => {
    const categoryItems = items.filter(item => item.category === activeCategory);
    const count = categoryItems.length;
    const maxItems = 50; 
    const progress = Math.min((count / maxItems) * 100, 100);

    return (
      <div className="h-full flex flex-col font-mono animate-fade-in">
        <Header />

        <div className="bg-white border-b border-gray-100 z-30">
            <div className="flex w-full">
                {CATEGORY_CONFIG.map(cat => (
                    <button 
                        key={cat.full}
                        onClick={() => setActiveCategory(cat.full)}
                        className={`flex-1 py-3 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-colors rounded-none ${activeCategory === cat.full ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32 hide-scrollbar">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CAPACITY</h2>
                <span className="text-[10px] text-gray-500">{count}/{maxItems}</span>
            </div>
            <div className="h-0.5 w-full bg-gray-100 mb-6">
                <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
            </div>

            <button 
                onClick={() => { resetForm(activeCategory); setView('edit'); }}
                className="w-full bg-black text-white py-2 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-800 transition mb-8 active:scale-[0.98] rounded-none"
            >
                <Plus size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">ADD NEW</span>
            </button>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {categoryItems.map(item => (
                    <div key={item.id} onClick={() => openEdit(item)} className="cursor-pointer group">
                        <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative shadow-sm rounded-none">
                            {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-105 filter grayscale-[10%] group-hover:grayscale-0" alt="Item" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200"><Shirt size={32}/></div>
                            )}
                            <div className="absolute top-2 left-2 bg-black text-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider">
                                {item.id}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
};

const OrganizePage = ({ items, searchQuery, setSearchQuery, ratingFilter, setRatingFilter, colorFilter, setColorFilter, stats, openEdit, onExport, onImport, brandFilter, setBrandFilter }) => {
    const [showStatsModal, setShowStatsModal] = useState(false);
    const currentYear = new Date().getFullYear().toString();

    const isFiltering = searchQuery !== '' || ratingFilter !== 0 || colorFilter !== '' || brandFilter !== '';

    const filteredItems = items.filter(item => {
        const matchSearch = searchQuery === '' || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.source?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRating = ratingFilter === 0 || item.rating === ratingFilter;
        const matchColor = colorFilter === '' || item.color === colorFilter;
        const matchBrand = brandFilter === '' || (item.source && item.source === brandFilter);
        return matchSearch && matchRating && matchColor && matchBrand;
    });

    const currentYearExpense = stats.sortedExpenses.find(([year]) => year === currentYear)?.[1] || 0;
    const topBrand = stats.sortedSources.length > 0 ? stats.sortedSources[0] : ['NONE', 0];

    const last5YearsStats = stats.sortedExpenses.filter(([year]) => {
        const y = parseInt(year);
        const cur = new Date().getFullYear();
        return y <= cur && y > cur - 5;
    });

    return (
        <div className="h-full flex flex-col font-mono animate-fade-in">
            <Header />
            
            <div className="p-6 bg-white z-30 border-b border-gray-50 space-y-4">
                <div className="bg-gray-50 flex items-center px-4 py-3">
                    <Search size={16} className="text-gray-400 mr-3"/>
                    <input 
                        type="text" 
                        placeholder="SEARCH COLLECTION..." 
                        className="bg-transparent w-full text-sm outline-none placeholder-gray-400 font-medium uppercase rounded-none"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} className="text-gray-400"/></button>}
                </div>

                <div className="space-y-4">
                    {/* 1. COLOR Filter */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                COLOR
                                {colorFilter && <button onClick={() => setColorFilter('')} className="text-black text-[9px] underline uppercase">CLEAR</button>}
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full pb-1">
                            {COLOR_PALETTE.map(c => (
                                <button 
                                  key={c.name}
                                  onClick={() => setColorFilter(colorFilter === c.value ? '' : c.value)}
                                  className={`w-6 h-6 rounded-sm border flex-shrink-0 ${colorFilter === c.value ? 'ring-1 ring-black ring-offset-2' : 'border-gray-200'}`}
                                  style={{backgroundColor: c.value}}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 2. RATING Filter */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RATING</span>
                            {ratingFilter !== 0 && <button onClick={() => setRatingFilter(0)} className="text-black text-[9px] underline uppercase">CLEAR</button>}
                        </div>
                        <div className="flex gap-2">
                            {[1,2,3,4,5].map(r => (
                                <button 
                                  key={r} 
                                  onClick={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                                  className={`flex-1 py-1 text-[10px] border transition rounded-none ${ratingFilter===r ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                                >
                                  {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. BRAND Filter */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                BRAND (TOP 5)
                                {brandFilter && <button onClick={() => setBrandFilter('')} className="text-black text-[9px] underline uppercase">CLEAR</button>}
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                             {stats.sortedSources.slice(0, 5).map(([name, count]) => (
                                <button 
                                    key={name}
                                    onClick={() => setBrandFilter(brandFilter === name ? '' : name)}
                                    className={`px-3 py-1 text-[9px] border uppercase whitespace-nowrap rounded-none ${brandFilter === name ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}
                                >
                                    {name} ({count})
                                </button>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
                {!isFiltering ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="border border-black p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
                                ANNUAL REPORT
                            </div>
                            
                            <div className="mt-2 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">{currentYear} TOTAL SPENT</span>
                                    <div className="text-3xl font-serif font-bold tracking-tight">NT${currentYearExpense.toLocaleString()}</div>
                                </div>
                                
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">MOST LOVED BRAND</span>
                                    <div className="flex items-baseline gap-3">
                                        <div className="text-xl font-bold uppercase truncate">{topBrand[0]}</div>
                                        <div className="text-[10px] bg-black text-white px-2 py-0.5 rounded-none whitespace-nowrap">{topBrand[1]} ITEMS</div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowStatsModal(true)}
                                className="w-full py-2 mt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition"
                            >
                                VIEW DETAILS <ChevronRight size={12} />
                            </button>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">DATA MANAGEMENT</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={onExport} className="flex items-center justify-center gap-2 py-2 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition rounded-none">
                                    <Download size={12} /> EXPORT
                                </button>
                                <label className="flex items-center justify-center gap-2 py-2 border border-black bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition cursor-pointer rounded-none">
                                    <Upload size={12} /> IMPORT
                                    <input type="file" accept=".json" onChange={onImport} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                      {filteredItems.length === 0 ? (
                          <div className="text-center py-20 text-gray-300 text-xs uppercase tracking-widest">NO ITEMS FOUND</div>
                      ) : (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-8 animate-fade-in">
                              {filteredItems.map(item => (
                                  <div key={item.id} onClick={() => openEdit(item)} className="cursor-pointer group">
                                      <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative shadow-sm mb-2 rounded-none">
                                          {item.image ? <img src={item.image} className="w-full h-full object-cover transition grayscale-[20%] group-hover:grayscale-0" alt="Item" /> : <div className="w-full h-full flex items-center justify-center"><Shirt size={32} className="text-gray-200"/></div>}
                                          <div className="absolute top-2 left-2 bg-black text-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider">{item.id}</div>
                                      </div>
                                      
                                      <div className="flex justify-between items-end">
                                          <div className="flex text-yellow-500">
                                              {[...Array(item.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                          </div>
                                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.source || 'UNKNOWN'}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                    </>
                )}
            </div>

            {showStatsModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col shadow-2xl modal-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={20} />
                                <h3 className="font-serif text-xl font-bold uppercase tracking-wide">STATISTICS</h3>
                            </div>
                            <button onClick={() => setShowStatsModal(false)}><X size={24} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-mono">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">LAST 5 YEARS EXPENSE</h4>
                                <div className="space-y-3">
                                    {last5YearsStats.map(([year, total]) => (
                                        <div key={year} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                            <span className="text-sm font-bold">{year}</span>
                                            <span className="text-sm text-gray-600">NT${total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {last5YearsStats.length === 0 && <div className="text-xs text-gray-300 text-center py-4">NO DATA AVAILABLE</div>}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">TOP 5 BRANDS</h4>
                                <div className="space-y-3">
                                    {stats.sortedSources.slice(0, 5).map(([name, count], index) => (
                                        <div key={name} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-gray-300 w-4">{index + 1}</span>
                                                <span className="text-sm font-bold">{name}</span>
                                            </div>
                                            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-none">{count} ITEMS</span>
                                        </div>
                                    ))}
                                    {stats.sortedSources.length === 0 && <div className="text-xs text-gray-300 text-center py-4">NO DATA AVAILABLE</div>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 pb-safe">
                            <button onClick={() => setShowStatsModal(false)} className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-900 rounded-none">
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const OutfitPage = ({ outfitTab, setOutfitTab, customConditions, setCustomConditions, generatedOutfit, setGeneratedOutfit, generateOutfit, isColorSimilar }) => {
    const renderConditions = () => (
        <div className="space-y-8">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WEATHER & SENSATION</label>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                        <select 
                            className="w-full border-b border-gray-200 py-2 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none"
                            value={customConditions.tempRange}
                            onChange={e => setCustomConditions({...customConditions, tempRange: e.target.value})}
                        >
                            <option value="">TEMP RANGE</option>
                            {TEMP_RANGES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <div className="absolute right-0 top-2 pointer-events-none text-gray-400"><ChevronDown size={14}/></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <select 
                                className="w-full border-b border-gray-200 py-2 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none"
                                value={customConditions.weather || ''}
                                onChange={e => setCustomConditions({...customConditions, weather: e.target.value})}
                            >
                                <option value="">WEATHER</option>
                                {WEATHER_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                            </select>
                            <div className="absolute right-0 top-2 pointer-events-none text-gray-400"><ChevronDown size={14}/></div>
                        </div>

                        <div className="relative">
                            <select 
                                className="w-full border-b border-gray-200 py-2 bg-transparent text-sm font-medium outline-none uppercase appearance-none rounded-none"
                                value={customConditions.sensation || ''}
                                onChange={e => setCustomConditions({...customConditions, sensation: e.target.value})}
                            >
                                <option value="">SENSATION</option>
                                {SENSATION_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                            </select>
                            <div className="absolute right-0 top-2 pointer-events-none text-gray-400"><ChevronDown size={14}/></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CONTEXT</label>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        {['INDOOR', 'OUTDOOR'].map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => setCustomConditions({...customConditions, environment: customConditions.environment === tag ? '' : tag})}
                                className={`w-full py-1 text-[10px] uppercase border rounded-none ${customConditions.environment === tag ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {['ACTIVE', 'STATIC'].map(tag => (
                             <button 
                                key={tag} 
                                onClick={() => setCustomConditions({...customConditions, activity: customConditions.activity === tag ? '' : tag})}
                                className={`w-full py-1 text-[10px] uppercase border rounded-none ${customConditions.activity === tag ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {PURPOSE_TAGS.map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => setCustomConditions({...customConditions, purpose: customConditions.purpose === tag ? '' : tag})}
                                className={`w-full py-1 text-[10px] uppercase border rounded-none truncate ${customConditions.purpose === tag ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TARGET (SELECT ONE)</label>
                <div className={`flex flex-wrap gap-2 transition-opacity ${customConditions.targetId ? 'opacity-30 pointer-events-none' : ''}`}>
                    {COLOR_PALETTE.map(c => (
                        <button key={c.name} onClick={() => setCustomConditions(prev => ({...prev, targetColor: prev.targetColor === c.value ? '' : c.value, targetId: ''}))} className={`w-8 h-8 aspect-square rounded-sm border ${customConditions.targetColor === c.value ? 'ring-1 ring-black ring-offset-2' : 'border-gray-100'}`} style={{backgroundColor: c.value}} />
                    ))}
                </div>
                <div className={`pt-2 transition-opacity ${customConditions.targetColor ? 'opacity-30' : ''}`}>
                    <input type="text" placeholder="ENTER ITEM ID #" className="w-full border-b border-gray-200 py-2 text-sm font-mono outline-none uppercase placeholder-gray-300 rounded-none" value={customConditions.targetId} onChange={e => setCustomConditions(prev => ({...prev, targetId: e.target.value.toUpperCase(), targetColor: ''}))} onFocus={() => setCustomConditions(prev => ({...prev, targetColor: ''}))} />
                </div>
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2 aspect-[4/3] bg-gray-50 flex items-center justify-center border border-gray-100 p-4 gap-4 rounded-none">
                {generatedOutfit.top && <img src={generatedOutfit.top.image} className="h-full object-contain mix-blend-multiply" alt="top"/>}
                {generatedOutfit.outer && <img src={generatedOutfit.outer.image} className="h-full object-contain mix-blend-multiply" alt="outer"/>}
            </div>
            {generatedOutfit.bottom && <div className="aspect-square bg-gray-50 border border-gray-100 p-2 rounded-none"><img src={generatedOutfit.bottom.image} className="w-full h-full object-contain mix-blend-multiply"/></div>}
            {generatedOutfit.shoes && <div className="aspect-square bg-gray-50 border border-gray-100 p-2 rounded-none"><img src={generatedOutfit.shoes.image} className="w-full h-full object-contain mix-blend-multiply"/></div>}
        </div>
    );

    return (
        <div className="h-full flex flex-col font-mono animate-fade-in relative">
            <Header />
            {/* [v5.40] Increased bottom padding to pb-48 to clear floating button + keyboard */}
            <div className="flex-1 overflow-y-auto p-6 pb-48 hide-scrollbar">
                {/* [v6.6] Removed Tab Switching UI */}
                {!generatedOutfit && renderConditions()}
                {generatedOutfit && renderResult()}
            </div>
            <div className="absolute bottom-28 left-6 right-6 z-20">
                <button 
                    onClick={generateOutfit} 
                    // [v5.40] Slimmer button: py-2
                    className="w-full bg-black text-white py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-gray-900 transition flex items-center justify-center gap-2 rounded-none"
                >
                    <RefreshCw size={16} /> {generatedOutfit ? 'REGENERATE' : 'GENERATE OUTFIT'}
                </button>
            </div>
        </div>
    );
};

// --- Main App Component ---

export default function App() {
  return (
    <div className="bg-white h-[100dvh] w-full flex justify-center text-black selection:bg-gray-200 overflow-hidden">
      <GlobalStyles />
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col border-x border-gray-50 overflow-hidden">
        <AppContent />
      </div>
    </div>
  );
}

// Separate component to hold state and logic
const AppContent = () => {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('wardrobe_items_v5');
            return saved ? JSON.parse(saved) : INITIAL_DATA;
        } catch (e) {
            return INITIAL_DATA;
        }
    });
    
    const [view, setView] = useState('wardrobe'); 
    const [activeCategory, setActiveCategory] = useState('TOPS'); 

    // Edit/Add Form State
    const [editingItem, setEditingItem] = useState(null); 
    const [formData, setFormData] = useState({
        name: '', category: 'TOPS', season: 'ALL', color: '#000000',
        material: '', thickness: 'MEDIUM', style: 'CASUAL', image: '', labelImage: '', rating: 3,
        purchaseDate: '', isUnknownDate: false,
        source: '', price: '', note: ''
    });

    // Outfit Generator State
    // [v6.6] Removed outfitTab state
    const [customConditions, setCustomConditions] = useState({
        tempRange: '', weather: '', sensation: '', 
        environment: '', activity: '', purpose: '', 
        targetColor: '', targetId: '' 
    });
    const [generatedOutfit, setGeneratedOutfit] = useState(null);

    // Organize State
    const [searchQuery, setSearchQuery] = useState('');
    const [ratingFilter, setRatingFilter] = useState(0); 
    const [colorFilter, setColorFilter] = useState(''); 
    const [brandFilter, setBrandFilter] = useState('');

    useEffect(() => {
      const initData = async () => {
        try {
          const dbItems = await dbHelper.getAll();
          if (dbItems && dbItems.length > 0) {
            setItems(dbItems);
          } else {
            const localItems = localStorage.getItem('wardrobe_items_v5');
            if (localItems) {
              const parsedItems = JSON.parse(localItems);
              if (parsedItems.length > 0) {
                console.log("Migrating data to IndexedDB...");
                for (const item of parsedItems) {
                  await dbHelper.save(item);
                }
              }
            }
          }
        } catch (err) {
          console.error("DB Init Failed:", err);
        }
      };
      initData();
    }, []);

    const handleExportData = async () => {
        try {
            const allItems = await dbHelper.getAll();
            const dataStr = JSON.stringify(allItems);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().split('T')[0];
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-closet-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("備份失敗");
        }
    };

    const handleImportData = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!window.confirm("警告：這將會清空目前的衣櫃資料並還原備份，確定要繼續嗎？")) {
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    await dbHelper.clear();
                    for (const item of data) {
                        await dbHelper.save(item);
                    }
                    setItems(data);
                    alert("還原成功！");
                } else {
                    alert("無效的備份檔案格式");
                }
            } catch (error) {
                alert("還原失敗，檔案可能損毀");
            }
        };
        reader.readAsText(file);
    };

    const resetForm = (categoryOverride = null) => {
        setFormData({
            name: '', category: categoryOverride || activeCategory, season: 'ALL', color: '#000000',
            material: '', thickness: 'MEDIUM', style: 'CASUAL', image: '', labelImage: '', rating: 3,
            purchaseDate: new Date().toISOString().split('T')[0], isUnknownDate: false,
            source: '', price: '', note: ''
        });
        setEditingItem(null);
    };

    const generateId = (categoryFull) => {
        const catConfig = CATEGORY_CONFIG.find(c => c.full === categoryFull);
        const code = catConfig ? catConfig.code : 'X';
        const existingIds = items
            .filter(i => i.id.startsWith(code))
            .map(i => parseInt(i.id.substring(1)))
            .filter(n => !isNaN(n));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const nextId = maxId + 1;
        return `${code}${nextId.toString().padStart(2, '0')}`;
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        
        const newId = editingItem ? editingItem.id : generateId(formData.category);
        const nameToSave = formData.name.trim() || `${formData.category} #${newId}`;

        const newItemData = {
            ...formData,
            id: newId,
            name: nameToSave,
            purchaseDate: formData.isUnknownDate ? 'unknown' : formData.purchaseDate
        };

        setItems(prevItems => {
            if (editingItem) {
                return prevItems.map(i => i.id === editingItem.id ? newItemData : i);
            } else {
                return [newItemData, ...prevItems];
            }
        });

        try {
          await dbHelper.save(newItemData);
        } catch (err) {
          alert("儲存失敗！");
        }
        setView('wardrobe');
    };

    const handleRemoveImage = (field) => {
        setFormData(prev => ({ ...prev, [field]: '' }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('DELETE THIS ITEM?')) {
            setItems(items.filter(item => item.id !== id));
            await dbHelper.delete(id);
            setView('wardrobe');
        }
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file);
                setFormData(prev => ({ ...prev, [field]: resizedImage }));
            } catch (error) {
                alert("圖片處理失敗");
            }
        }
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({
            ...item,
            isUnknownDate: item.purchaseDate === 'unknown',
            purchaseDate: item.purchaseDate === 'unknown' ? '' : item.purchaseDate
        });
        setView('edit');
    };

    const isColorSimilar = (hex1, hex2) => hex1 && hex2 && hex1.toLowerCase() === hex2.toLowerCase(); 

    const generateOutfit = () => {
        let pool = [...items];
        let picks = { top: null, bottom: null, shoes: null, outer: null };

        if (customConditions.targetId) {
            const t = items.find(i => i.id.toString() === customConditions.targetId);
            if (t) {
                if (t.category === 'TOPS') picks.top = t;
                if (t.category === 'BOTTOMS') picks.bottom = t;
                if (t.category === 'SHOES') picks.shoes = t;
                if (t.category === 'OUTER') picks.outer = t;
            }
        } else if (customConditions.targetColor) {
            const matches = pool.filter(i => isColorSimilar(i.color, customConditions.targetColor));
            if(matches.length > 0) {
                const m = matches[Math.floor(Math.random()*matches.length)];
                if(m.category === 'TOPS' && !picks.top) picks.top = m;
                else if(m.category === 'BOTTOMS' && !picks.bottom) picks.bottom = m;
                else if(m.category === 'SHOES' && !picks.shoes) picks.shoes = m;
                else if(m.category === 'OUTER' && !picks.outer) picks.outer = m;
            }
        }

        // [v6.5] Enhanced Logic with STYLE & THICKNESS
        const { tempRange, sensation, weather, activity, purpose } = customConditions;
        
        if(tempRange === 'freezing' || sensation === 'CHILLY' || sensation === 'COOL' || weather === 'SNOWY') {
            pool = pool.filter(i => i.thickness === 'THICK' || i.thickness === 'WARM' || i.category === 'OUTER');
        } else if ((tempRange === 'hot' || sensation === 'MUGGY') && weather !== 'SNOWY') {
            pool = pool.filter(i => i.thickness === 'THIN' && i.category !== 'OUTER');
        }

        // 2. Style (Context) Filter
        // Logic: If purpose is selected, filter items that match or are compatible
        if (purpose) {
            if (purpose === 'FORMAL') {
                // Formal needs Formal or Party items, usually not Sport
                pool = pool.filter(i => i.style === 'FORMAL' || i.style === 'PARTY' || !i.style); // undefined style implies neutral
            } else if (purpose === 'CASUAL' || purpose === 'DATE') {
                // Casual/Date can use almost anything except maybe strict Home wear
                pool = pool.filter(i => i.style !== 'HOME');
            }
        }
        
        // Activity Filter
        if (activity === 'ACTIVE') {
            pool = pool.filter(i => i.style === 'SPORT' || i.style === 'CASUAL' || !i.style);
        }

        const tops = pool.filter(i => i.category === 'TOPS' || i.category === 'DRESS');
        const bottoms = pool.filter(i => i.category === 'BOTTOMS');
        const shoes = items.filter(i => i.category === 'SHOES');
        const outers = pool.filter(i => i.category === 'OUTER');
        
        if(!picks.top && tops.length > 0) picks.top = tops[Math.floor(Math.random() * tops.length)];
        if(!picks.bottom && picks.top?.category !== 'DRESS' && bottoms.length > 0) picks.bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        if(!picks.shoes && shoes.length > 0) picks.shoes = shoes[Math.floor(Math.random() * shoes.length)];
        
        if(!picks.outer && outers.length > 0) {
            const isCold = customConditions.tempRange === 'freezing' || customConditions.tempRange === 'cold' || customConditions.sensation === 'CHILLY';
            if(isCold || Math.random() > 0.7) picks.outer = outers[Math.floor(Math.random() * outers.length)];
        }
        setGeneratedOutfit(picks);
    };

    const statsData = useMemo(() => {
        const expenses = {};
        const sources = {};
        items.forEach(item => {
            if (item.purchaseDate && item.purchaseDate !== 'unknown' && item.price) {
                const year = item.purchaseDate.split('-')[0];
                expenses[year] = (expenses[year] || 0) + Number(item.price);
            }
            const src = item.source ? item.source.toUpperCase() : 'UNKNOWN';
            sources[src] = (sources[src] || 0) + 1;
        });
        const sortedExpenses = Object.entries(expenses).sort((a, b) => b[0] - a[0]);
        const sortedSources = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 5);
        return { sortedExpenses, sortedSources };
    }, [items]);

    return (
        <>
            {view === 'edit' && 
                <EditPage 
                    formData={formData} 
                    setFormData={setFormData} 
                    handleSaveItem={handleSaveItem} 
                    handleDelete={handleDelete} 
                    handleImageUpload={handleImageUpload} 
                    handleRemoveImage={handleRemoveImage}
                    editingItem={editingItem} 
                    setView={setView}
                />
            }
            
            {view !== 'edit' && (
                <>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {view === 'wardrobe' && 
                            <WardrobePage 
                                items={items} 
                                activeCategory={activeCategory} 
                                setActiveCategory={setActiveCategory} 
                                resetForm={resetForm} 
                                setView={setView} 
                                openEdit={openEdit}
                            />
                        }
                        {view === 'organize' && 
                            <OrganizePage 
                                items={items} 
                                searchQuery={searchQuery} 
                                setSearchQuery={setSearchQuery} 
                                ratingFilter={ratingFilter} 
                                setRatingFilter={setRatingFilter} 
                                colorFilter={colorFilter} 
                                setColorFilter={setColorFilter} 
                                // [v6.7 Fix] Removed materialFilter
                                brandFilter={brandFilter}
                                setBrandFilter={setBrandFilter}
                                stats={statsData} 
                                openEdit={openEdit}
                                onExport={handleExportData}
                                onImport={handleImportData}
                            />
                        }
                        {view === 'outfit' && 
                            <OutfitPage 
                                // Removed outfitTab & setOutfitTab
                                customConditions={customConditions} 
                                setCustomConditions={setCustomConditions} 
                                generatedOutfit={generatedOutfit} 
                                setGeneratedOutfit={setGeneratedOutfit} 
                                generateOutfit={generateOutfit} 
                                isColorSimilar={isColorSimilar}
                            />
                        }
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pt-4 pb-safe flex justify-between items-center z-50 text-[10px] font-bold font-mono uppercase tracking-widest text-gray-400">
                        <button onClick={() => setView('wardrobe')} className={`flex flex-col items-center gap-1 transition ${view === 'wardrobe' ? 'text-black' : 'hover:text-gray-600'}`}>
                            <LayoutGrid size={20} strokeWidth={1.5} /> WARDROBE
                        </button>
                        <button onClick={() => setView('outfit')} className={`flex flex-col items-center gap-1 transition ${view === 'outfit' ? 'text-black' : 'hover:text-gray-600'}`}>
                            <Sparkles size={20} strokeWidth={1.5} /> OUTFIT
                        </button>
                        <button onClick={() => setView('organize')} className={`flex flex-col items-center gap-1 transition ${view === 'organize' ? 'text-black' : 'hover:text-gray-600'}`}>
                            <ListFilter size={20} strokeWidth={1.5} /> ORGANIZE
                        </button>
                    </div>
                </>
            )}
        </>
    );
};