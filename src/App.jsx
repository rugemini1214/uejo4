import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Shuffle, Shirt, Search, X, Save, RefreshCw, 
  ShoppingBag, Camera, ArrowRight, Loader2, Sparkles, 
  Thermometer, MapPin, Hash, Star, Briefcase, 
  Wind, CloudRain, Sun, Cloud, LayoutGrid, ListFilter, Check, Tag, FileText, TrendingUp, Store, Minus
} from 'lucide-react';

// --- 版本設定 ---
const APP_VERSION = 'v5.16';

// --- 全域樣式與字體設定 ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700&display=swap');
    
    /* [v5.16 修正] 改用更兼容的方式鎖定視窗，恢復 Canvas 預覽功能 */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden; /* 禁止瀏覽器本身的捲動 */
      overscroll-behavior: none; /* 禁止 iOS 彈性拉動 */
      -webkit-font-smoothing: antialiased;
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

    /* --- iOS & Mobile 體驗優化 --- */
    @media screen and (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
      }
    }
    .pb-safe {
      padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
    }
    .pt-safe-header {
      padding-top: max(1rem, env(safe-area-inset-top));
    }
  `}</style>
);

// --- 資料結構與常數 ---
const INITIAL_DATA = [
  { id: 'T01', name: 'WHITE T-SHIRT', category: 'TOPS', season: 'SUMMER', color: '#ffffff', image: '', labelImage: '', material: 'COTTON 100%', thickness: 'THIN', rating: 5, purchaseDate: '2023-06-15', source: 'UNIQLO', price: 390, note: 'ESSENTIAL BASIC.' },
  { id: 'B01', name: 'DENIM WIDE LEG', category: 'BOTTOMS', season: 'ALL', color: '#3b82f6', image: '', labelImage: '', material: 'COTTON 98% / SPANDEX 2%', thickness: 'MEDIUM', rating: 4, purchaseDate: 'unknown', source: 'GU', price: 590, note: '' },
  { id: 'O01', name: 'TRENCH COAT', category: 'OUTER', season: 'AUTUMN', color: '#f5f5dc', image: '', labelImage: '', material: 'POLYESTER 100%', thickness: 'MEDIUM', rating: 5, purchaseDate: '2022-11-20', source: 'ONLINE', price: 1280, note: 'FOR WORK.' },
  { id: 'S01', name: 'CLASSIC SNEAKERS', category: 'SHOES', season: 'ALL', color: '#ffffff', image: '', labelImage: '', material: 'LEATHER 100%', thickness: 'MEDIUM', rating: 3, purchaseDate: '2024-01-10', source: 'NIKE', price: 2500, note: 'GETTING DIRTY.' },
  { id: 'B02', name: 'BLACK SLACKS', category: 'BOTTOMS', season: 'ALL', color: '#000000', image: '', labelImage: '', material: 'WOOL 60% / POLYESTER 40%', thickness: 'MEDIUM', rating: 4, purchaseDate: '2023-09-01', source: 'ZARA', price: 990, note: 'FORMAL EVENTS.' },
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
const MATERIALS_MOCK = [
    'COTTON 100%', 'COTTON 60% / POLYESTER 40%', 'WOOL 100%', 'COTTON 98% / SPANDEX 2%', 'LINEN 55% / COTTON 45%', 'POLYESTER 100%', 'LEATHER 100%', 'NYLON 80% / SPANDEX 20%'
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
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">MATERIAL (AI)</label>
            <div className="space-y-2">
                {rows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input 
                            type="text" 
                            className="flex-1 border-b border-gray-200 py-1 bg-transparent text-sm font-medium outline-none placeholder-gray-300 uppercase"
                            placeholder="COTTON"
                            value={row.name}
                            onChange={(e) => updateRow(i, 'name', e.target.value)}
                        />
                        <div className="flex items-center w-20 border-b border-gray-200">
                            <input 
                                type="number" 
                                className="w-full py-1 bg-transparent text-sm font-medium outline-none text-right"
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
                <button type="button" onClick={addRow} className="flex items-center gap-1 text-[10px] font-bold text-black uppercase hover:opacity-50 mt-1">
                    <Plus size={10} /> ADD MATERIAL
                </button>
            </div>
        </div>
    );
};

const EditPage = ({ formData, setFormData, handleSaveItem, handleDelete, handleImageUpload, editingItem, isAiLoading, setView }) => (
    <div className="bg-white h-full flex flex-col font-mono animate-fade-in">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-40 pt-safe-header">
            <button onClick={() => setView('wardrobe')}><X size={24} className="text-black"/></button>
            <span className="font-serif font-bold text-lg tracking-wide uppercase">{editingItem ? 'EDITOR' : 'NEW ITEM'}</span>
            <button onClick={handleSaveItem} className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5 hover:opacity-50">SAVE</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-safe">
            <div className="flex gap-4 h-64">
                <div className="flex-1 relative bg-gray-50 flex flex-col items-center justify-center overflow-hidden border border-gray-100 group">
                    {formData.image ? (
                        <img src={formData.image} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <Camera size={24} className="mx-auto mb-2 text-gray-300"/>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">MAIN PHOTO</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'image')} />
                </div>

                <div className="w-1/3 relative bg-gray-50 flex flex-col items-center justify-center overflow-hidden border border-dashed border-gray-200 hover:border-black transition group">
                    {formData.labelImage ? (
                        <img src={formData.labelImage} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-2">
                            <Tag size={20} className="mx-auto mb-2 text-gray-300"/>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-tight block">LABEL<br/>PHOTO</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'labelImage')} />
                </div>
            </div>

            {isAiLoading && <div className="text-center text-[10px] font-bold uppercase tracking-widest animate-pulse">AI ANALYZING FABRIC & COLOR...</div>}

            <div className="space-y-6">
                <div className="border-b border-black pb-2">
                    <input 
                      type="text" 
                      className="w-full text-xl font-bold placeholder-gray-200 outline-none bg-transparent uppercase" 
                      placeholder="ITEM NAME" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">COLOR (AI)</label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PALETTE.map(c => (
                                <button 
                                  key={c.name}
                                  onClick={() => setFormData({...formData, color: c.value})}
                                  className={`w-6 h-6 rounded-full border transition ${formData.color === c.value ? 'ring-2 ring-black ring-offset-2' : 'border-gray-200'}`}
                                  style={{backgroundColor: c.value}}
                                  title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <MaterialEditor 
                        materialString={formData.material} 
                        onChange={(newVal) => setFormData({...formData, material: newVal})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">CATEGORY</label>
                        <select className="w-full border-b border-gray-200 py-1 bg-transparent text-sm font-medium outline-none uppercase" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            {CATEGORY_CONFIG.map(c => <option key={c.full} value={c.full}>{c.full}</option>)}
                        </select>
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
                    <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-4">META DATA</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <input 
                          type="text" 
                          placeholder="BRAND / SOURCE" 
                          className="border-b border-gray-200 py-2 outline-none uppercase" 
                          value={formData.source} 
                          onChange={e => setFormData({...formData, source: e.target.value})} 
                        />
                        <input 
                          type="number" 
                          placeholder="PRICE (NT$)" 
                          className="border-b border-gray-200 py-2 outline-none" 
                          value={formData.price} 
                          onChange={e => setFormData({...formData, price: e.target.value})} 
                        />
                    </div>
                    <textarea 
                      className="w-full border-b border-gray-200 py-2 mt-4 text-sm outline-none resize-none h-20 placeholder-gray-300" 
                      placeholder="NOTES..." 
                      value={formData.note} 
                      onChange={e => setFormData({...formData, note: e.target.value})} 
                    />
                </div>

                {editingItem && (
                    <button onClick={() => handleDelete(editingItem.id)} className="w-full py-4 text-xs font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 transition">
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

        <div className="bg-white sticky top-[84px] z-30 border-b border-gray-100">
            <div className="flex w-full">
                {CATEGORY_CONFIG.map(cat => (
                    <button 
                        key={cat.full}
                        onClick={() => setActiveCategory(cat.full)}
                        className={`flex-1 py-3 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-colors ${activeCategory === cat.full ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-28">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CAPACITY</h2>
                <span className="text-[10px] text-gray-500">{count}/{maxItems}</span>
            </div>
            <div className="h-0.5 w-full bg-gray-100 mb-6">
                <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
            </div>

            <button 
                onClick={() => { resetForm(activeCategory); setView('edit'); }}
                className="w-full bg-black text-white py-4 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-800 transition mb-8 active:scale-[0.98]"
            >
                <Plus size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">ADD NEW</span>
            </button>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {categoryItems.map(item => (
                    <div key={item.id} onClick={() => openEdit(item)} className="cursor-pointer group">
                        <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative shadow-sm">
                            {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-105 filter grayscale-[10%] group-hover:grayscale-0" />
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

const OrganizePage = ({ items, searchQuery, setSearchQuery, ratingFilter, setRatingFilter, colorFilter, setColorFilter, stats, openEdit }) => {
    const isFiltering = searchQuery !== '' || ratingFilter !== 0 || colorFilter !== '';

    const filteredItems = items.filter(item => {
        const matchSearch = searchQuery === '' || 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.source?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRating = ratingFilter === 0 || item.rating === ratingFilter;
        const matchColor = colorFilter === '' || item.color === colorFilter;
        return matchSearch && matchRating && matchColor;
    });

    return (
        <div className="h-full flex flex-col font-mono animate-fade-in">
            <Header />
            
            <div className="p-6 sticky top-[84px] bg-white z-30 border-b border-gray-50 space-y-4">
                <div className="bg-gray-50 flex items-center px-4 py-3">
                    <Search size={16} className="text-gray-400 mr-3"/>
                    <input 
                        type="text" 
                        placeholder="SEARCH COLLECTION..." 
                        className="bg-transparent w-full text-sm outline-none placeholder-gray-400 font-medium uppercase"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} className="text-gray-400"/></button>}
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RATING</span>
                        <div className="flex gap-2">
                            {[1,2,3,4,5].map(r => (
                                <button 
                                  key={r} 
                                  onClick={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                                  className={`w-7 h-7 flex items-center justify-center text-[10px] border transition ${ratingFilter===r ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                                >
                                  {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            COLOR
                            {colorFilter && <button onClick={() => setColorFilter('')} className="text-black text-[9px] underline uppercase">CLEAR</button>}
                        </span>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full justify-end">
                            {COLOR_PALETTE.map(c => (
                                <button 
                                  key={c.name}
                                  onClick={() => setColorFilter(colorFilter === c.value ? '' : c.value)}
                                  className={`w-5 h-5 rounded-full border flex-shrink-0 ${colorFilter === c.value ? 'ring-1 ring-black ring-offset-2' : 'border-gray-200'}`}
                                  style={{backgroundColor: c.value}}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-28">
                {!isFiltering ? (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Annual Expense</h3>
                            </div>
                            <div className="space-y-3">
                                {stats.sortedExpenses.length > 0 ? stats.sortedExpenses.map(([year, total]) => (
                                    <div key={year} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-sm font-bold">{year}</span>
                                        <span className="text-sm text-gray-500 font-mono">NT${total.toLocaleString()}</span>
                                    </div>
                                )) : <div className="text-xs text-gray-300">No data available</div>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Store size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Top Brands</h3>
                            </div>
                            <div className="space-y-3">
                                {stats.sortedSources.length > 0 ? stats.sortedSources.map(([name, count]) => (
                                    <div key={name} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-sm font-bold">{name}</span>
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count} ITEMS</span>
                                    </div>
                                )) : <div className="text-xs text-gray-300">No data available</div>}
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
                                      <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative shadow-sm mb-2">
                                          {item.image ? <img src={item.image} className="w-full h-full object-cover transition grayscale-[20%] group-hover:grayscale-0" /> : <div className="w-full h-full flex items-center justify-center"><Shirt size={32} className="text-gray-200"/></div>}
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
        </div>
    );
};

const OutfitPage = ({ outfitTab, setOutfitTab, customConditions, setCustomConditions, generatedOutfit, setGeneratedOutfit, generateOutfit, isColorSimilar }) => {
    // 壓縮介面間距 (space-y-4, mb-4, py-2)
    const renderConditions = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WEATHER & SENSATION</label>
                <div className="grid grid-cols-4 gap-2">
                    {TEMP_RANGES.map(t => (
                        <button key={t.value} onClick={() => setCustomConditions({...customConditions, tempRange: customConditions.tempRange === t.value ? '' : t.value})} className={`py-2 text-[10px] border uppercase ${customConditions.tempRange === t.value ? 'bg-black text-white border-black' : 'border-gray-200'}`}>{t.label}</button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {[...WEATHER_TAGS, ...SENSATION_TAGS].map(tag => (
                        <button key={tag} onClick={() => {
                            const isWeather = WEATHER_TAGS.includes(tag);
                            const target = isWeather ? 'weather' : 'sensation';
                            setCustomConditions({...customConditions, [target]: customConditions[target] === tag ? '' : tag});
                        }} className={`px-3 py-1.5 text-[10px] uppercase border ${customConditions.weather === tag || customConditions.sensation === tag ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}>{tag}</button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CONTEXT</label>
                <div className="flex flex-wrap gap-2">
                    {[...ENVIRONMENT_OPTIONS, ...ACTIVITY_OPTIONS, ...PURPOSE_TAGS].map(tag => (
                        <button key={tag} onClick={() => {
                            let target = 'purpose';
                            if (ENVIRONMENT_OPTIONS.includes(tag)) target = 'environment';
                            else if (ACTIVITY_OPTIONS.includes(tag)) target = 'activity';
                            setCustomConditions({...customConditions, [target]: customConditions[target] === tag ? '' : tag});
                        }} className={`px-3 py-1.5 text-[10px] uppercase border ${[customConditions.environment, customConditions.activity, customConditions.purpose].includes(tag) ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500'}`}>{tag}</button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TARGET (SELECT ONE)</label>
                <div className={`grid grid-cols-7 gap-2 transition-opacity ${customConditions.targetId ? 'opacity-30 pointer-events-none' : ''}`}>
                    {COLOR_PALETTE.map(c => (
                        <button key={c.name} onClick={() => setCustomConditions(prev => ({...prev, targetColor: prev.targetColor === c.value ? '' : c.value, targetId: ''}))} className={`w-full aspect-square border ${customConditions.targetColor === c.value ? 'ring-1 ring-black ring-offset-2' : 'border-gray-100'}`} style={{backgroundColor: c.value}} />
                    ))}
                </div>
                <div className={`pt-2 transition-opacity ${customConditions.targetColor ? 'opacity-30' : ''}`}>
                    <input type="text" placeholder="ENTER ITEM ID #" className="w-full border-b border-gray-200 py-2 text-sm font-mono outline-none uppercase placeholder-gray-300" value={customConditions.targetId} onChange={e => setCustomConditions(prev => ({...prev, targetId: e.target.value.toUpperCase(), targetColor: ''}))} onFocus={() => setCustomConditions(prev => ({...prev, targetColor: ''}))} />
                </div>
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2 aspect-[4/3] bg-gray-50 flex items-center justify-center border border-gray-100 p-4 gap-4">
                {generatedOutfit.top && <img src={generatedOutfit.top.image} className="h-full object-contain mix-blend-multiply" alt="top"/>}
                {generatedOutfit.outer && <img src={generatedOutfit.outer.image} className="h-full object-contain mix-blend-multiply" alt="outer"/>}
            </div>
            {generatedOutfit.bottom && <div className="aspect-square bg-gray-50 border border-gray-100 p-2"><img src={generatedOutfit.bottom.image} className="w-full h-full object-contain mix-blend-multiply"/></div>}
            {generatedOutfit.shoes && <div className="aspect-square bg-gray-50 border border-gray-100 p-2"><img src={generatedOutfit.shoes.image} className="w-full h-full object-contain mix-blend-multiply"/></div>}
        </div>
    );

    return (
        <div className="h-full flex flex-col font-mono animate-fade-in relative">
            <Header />
            <div className="flex-1 overflow-y-auto p-6 pb-32">
                <div className="flex border-b border-gray-100 mb-4">
                    <button onClick={() => {setOutfitTab('random'); setGeneratedOutfit(null);}} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition ${outfitTab === 'random' ? 'text-black border-b-2 border-black' : 'text-gray-300'}`}>RANDOM</button>
                    <button onClick={() => {setOutfitTab('custom'); setGeneratedOutfit(null);}} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition ${outfitTab === 'custom' ? 'text-black border-b-2 border-black' : 'text-gray-300'}`}>CONDITIONS</button>
                </div>
                {outfitTab === 'custom' && !generatedOutfit && renderConditions()}
                {outfitTab === 'random' && !generatedOutfit && <div className="text-center py-20 text-gray-300"><Sparkles size={48} className="mx-auto mb-4 opacity-50 stroke-1"/>GET INSPIRED</div>}
                {generatedOutfit && renderResult()}
            </div>
            <div className="absolute bottom-24 left-6 right-6 z-20 pb-safe">
                <button onClick={generateOutfit} className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-gray-900 transition flex items-center justify-center gap-2">
                    <RefreshCw size={16} /> {generatedOutfit ? 'REGENERATE' : 'GENERATE OUTFIT'}
                </button>
            </div>
        </div>
    );
};

const ShoppingPage = ({ shoppingCheck, setShoppingCheck, shoppingResult, setShoppingResult, isAnalyzing, setIsAnalyzing }) => (
    <div className="h-full flex flex-col font-mono animate-fade-in">
        <Header />
        <div className="flex-1 overflow-y-auto p-6">
            <div className="border border-gray-200 p-8 text-center space-y-4">
                <h3 className="font-serif text-xl uppercase">SHOPPING ASSISTANT</h3>
                <p className="text-xs text-gray-400 leading-relaxed uppercase">UPLOAD A PHOTO OF THE ITEM YOU WANT TO BUY. AI WILL ANALYZE YOUR CURRENT WARDROBE TO PREVENT DUPLICATES.</p>
                <label className="block w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest cursor-pointer hover:opacity-90">
                    UPLOAD PHOTO
                    <input type="file" className="hidden" onChange={(e) => {
                        if(e.target.files[0]) {
                            setIsAnalyzing(true);
                            setTimeout(() => { setIsAnalyzing(false); setShoppingResult({match: 3}); }, 1500);
                        }
                    }} />
                </label>
            </div>
            {isAnalyzing && <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto"/></div>}
            {shoppingResult && (
                <div className="mt-8 bg-gray-50 p-6 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">ANALYSIS RESULT</span>
                    <h4 className="font-serif text-lg mb-1 uppercase">WAIT A MOMENT.</h4>
                    <p className="text-sm text-gray-600 uppercase">YOU ALREADY HAVE <strong>{shoppingResult.match}</strong> SIMILAR ITEMS IN YOUR WARDROBE.</p>
                </div>
            )}
        </div>
    </div>
);

// --- Main App Component ---

export default function App() {
  return (
    // 外層容器：鎖定高度為 100dvh (手機動態高度)，隱藏溢出
    <div className="bg-white h-[100dvh] w-full flex justify-center text-black selection:bg-gray-200 overflow-hidden">
      <GlobalStyles />
      {/* 內層 App 容器：高度 100%，使用 flex-col 排版 */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col border-x border-gray-50 overflow-hidden">
        
        <AppContent />

      </div>
    </div>
  );
}

// Separate component to hold state and logic
const AppContent = () => {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('wardrobe_items_v5');
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    });
    
    const [view, setView] = useState('wardrobe'); 
    const [activeCategory, setActiveCategory] = useState('TOPS'); 

    // Edit/Add Form State
    const [editingItem, setEditingItem] = useState(null); 
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', category: 'TOPS', season: 'ALL', color: '#000000',
        material: '', thickness: 'MEDIUM', image: '', labelImage: '', rating: 3,
        purchaseDate: '', isUnknownDate: false,
        source: '', price: '', note: ''
    });

    // Outfit Generator State
    const [outfitTab, setOutfitTab] = useState('random'); 
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

    // Shopping State
    const [shoppingCheck, setShoppingCheck] = useState({ image: null });
    const [shoppingResult, setShoppingResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        localStorage.setItem('wardrobe_items_v5', JSON.stringify(items));
    }, [items]);

    const resetForm = (categoryOverride = null) => {
        setFormData({
            name: '', category: categoryOverride || activeCategory, season: 'ALL', color: '#000000',
            material: '', thickness: 'MEDIUM', image: '', labelImage: '', rating: 3,
            purchaseDate: new Date().toISOString().split('T')[0], isUnknownDate: false,
            source: '', price: '', note: ''
        });
        setEditingItem(null);
    };

    const handleSaveItem = (e) => {
        e.preventDefault();
        if (!formData.name) return;
        
        const newId = editingItem ? editingItem.id : generateId(formData.category);
        const newItemData = {
            ...formData,
            id: newId,
            purchaseDate: formData.isUnknownDate ? 'unknown' : formData.purchaseDate
        };
        if (editingItem) {
            setItems(items.map(i => i.id === editingItem.id ? newItemData : i));
        } else {
            setItems([newItemData, ...items]);
        }
        setView('wardrobe');
    };

    const handleDelete = (id) => {
        if (window.confirm('DELETE THIS ITEM?')) {
            setItems(items.filter(item => item.id !== id));
            setView('wardrobe');
        }
    };

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const imgData = reader.result;
                setFormData(prev => ({ ...prev, [field]: imgData }));
                
                if (!formData.name) { 
                    setIsAiLoading(true);
                    setTimeout(() => {
                        const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].value;
                        const randomMaterial = MATERIALS_MOCK[Math.floor(Math.random() * MATERIALS_MOCK.length)];
                        
                        if (field === 'labelImage') {
                            setFormData(prev => ({ ...prev, material: randomMaterial }));
                        } else {
                            setFormData(prev => ({ ...prev, color: randomColor }));
                        }
                        
                        setIsAiLoading(false);
                    }, 800);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const isColorSimilar = (hex1, hex2) => hex1 && hex2 && hex1.toLowerCase() === hex2.toLowerCase(); 

    const generateOutfit = () => {
        let pool = [...items];
        let picks = { top: null, bottom: null, shoes: null, outer: null };

        if (outfitTab === 'custom') {
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

            const { tempRange, sensation, weather, activity } = customConditions;
            
            if(tempRange === 'freezing' || sensation === 'CHILLY' || sensation === 'COOL' || weather === 'SNOWY') {
                pool = pool.filter(i => i.thickness === 'THICK' || i.thickness === 'WARM' || i.category === 'OUTER');
            } else if ((tempRange === 'hot' || sensation === 'MUGGY') && weather !== 'SNOWY') {
                pool = pool.filter(i => i.thickness === 'THIN' && i.category !== 'OUTER');
            }
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
                    editingItem={editingItem} 
                    isAiLoading={isAiLoading} 
                    setView={setView}
                />
            }
            
            {view !== 'edit' && (
                <>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                                stats={statsData} 
                                openEdit={openEdit}
                            />
                        }
                        {view === 'outfit' && 
                            <OutfitPage 
                                outfitTab={outfitTab} 
                                setOutfitTab={setOutfitTab} 
                                customConditions={customConditions} 
                                setCustomConditions={setCustomConditions} 
                                generatedOutfit={generatedOutfit} 
                                setGeneratedOutfit={setGeneratedOutfit} 
                                generateOutfit={generateOutfit} 
                                isColorSimilar={isColorSimilar}
                            />
                        }
                        {view === 'shopping' && 
                            <ShoppingPage 
                                shoppingCheck={shoppingCheck}
                                setShoppingCheck={setShoppingCheck}
                                shoppingResult={shoppingResult} 
                                setShoppingResult={setShoppingResult} 
                                isAnalyzing={isAnalyzing} 
                                setIsAnalyzing={setIsAnalyzing} 
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
                        <button onClick={() => setView('shopping')} className={`flex flex-col items-center gap-1 transition ${view === 'shopping' ? 'text-black' : 'hover:text-gray-600'}`}>
                            <ShoppingBag size={20} strokeWidth={1.5} /> SHOP
                        </button>
                    </div>
                </>
            )}
        </>
    );
};