import React, { useState } from 'react';
import { Material, RequestItem, Rig, Employee } from '../types';
import { Plus, Trash2, Search, Package, User, MapPin, Sparkles, Loader2, ChevronDown, Check, Cloud, RefreshCw } from 'lucide-react';
import { findMaterialWithAI } from '../services/aiService';

interface RequestFormProps {
  onSubmit: (rigId: string, employeeId: string, supervisorId: string, items: RequestItem[]) => void;
  rigs: Rig[];
  employees: Employee[];
  materials: Material[];
  currentUser?: Employee;
  syncId: string;
  onPerformSync: (isPush: boolean) => void;
  isSyncing: boolean;
}

export const RequestForm: React.FC<RequestFormProps> = ({ 
  onSubmit, rigs, employees, materials, currentUser, 
  syncId, onPerformSync, isSyncing 
}) => {
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(currentUser || null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Employee | null>(null);
  
  // Search States for Dropdowns
  const [rigSearch, setRigSearch] = useState('');
  const [isRigOpen, setIsRigOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<RequestItem[]>([]);
  
  // Item Entry State
  const [itemSearch, setItemSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  // AI State
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  const filteredRigs = rigs.filter(r => 
    r.name.toLowerCase().includes(rigSearch.toLowerCase()) || 
    r.id.toLowerCase().includes(rigSearch.toLowerCase())
  );
  
  const supervisors = employees.filter(e => e.role === 'Supervisor');
  const availableEmployees = employees.filter(e => e.role !== 'Supervisor');

  const handleSelectRig = (rig: Rig) => {
    setSelectedRig(rig);
    setRigSearch(rig.name);
    setIsRigOpen(false);
  };

  const handleAddItem = () => {
    if (selectedMaterial && quantity > 0) {
      setCartItems([...cartItems, { material: selectedMaterial, quantity }]);
      setSelectedMaterial(null);
      setItemSearch('');
      setQuantity(1);
      setAiReasoning(null);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const handleSubmit = () => {
    if (selectedRig && selectedSupervisor && selectedEmployee && cartItems.length > 0) {
      onSubmit(selectedRig.id, selectedEmployee.id, selectedSupervisor.id, cartItems);
      setCartItems([]);
      setSelectedRig(null);
      setSelectedSupervisor(null);
      if (!currentUser) setSelectedEmployee(null);
      setRigSearch('');
    }
  };

  const handleAiSearch = async () => {
    if (!itemSearch.trim()) return;
    setIsSearchingAI(true);
    setAiReasoning(null);
    try {
      const result = await findMaterialWithAI(itemSearch, materials);
      if (result) {
        const foundMaterial = materials.find(m => m.sku === result.sku);
        if (foundMaterial) {
          setSelectedMaterial(foundMaterial);
          setAiReasoning(result.reasoning);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingAI(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.description.toLowerCase().includes(itemSearch.toLowerCase()) || 
    m.sku.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Sync Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            {currentUser ? <User className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Status do Formulário</p>
            <p className="text-sm font-bold text-slate-800">
                {currentUser ? `${currentUser.name} (Logado)` : 'Aberto para Solicitações'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Sincronização</p>
             <p className="text-xs font-mono font-bold text-blue-600">{syncId}</p>
          </div>
          <button 
            onClick={() => { onPerformSync(false); alert('Base de dados sincronizada com sucesso!'); }}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
            title="Atualizar dados da nuvem"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> : <Cloud className="w-4 h-4" />}
            <span className="text-sm font-medium">Sincronizar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Preencher Nova Solicitação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Employee Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Solicitante (Colaborador) <span className="text-red-500">*</span>
            </label>
            <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                value={selectedEmployee?.id || ''}
                onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value) || null)}
                disabled={!!currentUser}
            >
                <option value="">Selecione quem solicita...</option>
                {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                ))}
            </select>
          </div>

          {/* Rig Searchable Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sonda (Unidade) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className={`flex items-center w-full bg-slate-50 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 transition-all cursor-text ${selectedRig ? 'border-green-500 bg-green-50/30' : 'border-slate-300'}`}
                onClick={() => setIsRigOpen(true)}
              >
                <MapPin className={`w-5 h-5 ml-3 flex-shrink-0 ${selectedRig ? 'text-green-600' : 'text-slate-400'}`} />
                <input
                  type="text"
                  className="w-full pl-2 pr-8 py-2.5 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  placeholder="Qual a sonda?"
                  value={rigSearch}
                  onChange={(e) => {
                    setRigSearch(e.target.value);
                    setIsRigOpen(true);
                    if (selectedRig && e.target.value !== selectedRig.name) setSelectedRig(null);
                  }}
                  onFocus={() => setIsRigOpen(true)}
                />
                <div className="absolute right-2 flex items-center">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isRigOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isRigOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRigOpen(false)} />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredRigs.length > 0 ? (
                      filteredRigs.map((rig) => (
                        <button
                          key={rig.id}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group"
                          onClick={() => handleSelectRig(rig)}
                        >
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-blue-700">{rig.name}</p>
                            <p className="text-xs text-slate-500">{rig.id} • {rig.location}</p>
                          </div>
                          {selectedRig?.id === rig.id && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-400 text-center">Nenhuma sonda encontrada.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supervisor de Turno <span className="text-red-500">*</span>
            </label>
            <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                value={selectedSupervisor?.id || ''}
                onChange={(e) => setSelectedSupervisor(supervisors.find(s => s.id === e.target.value) || null)}
            >
                <option value="">Selecione o supervisor...</option>
                {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Itens da Solicitação</h3>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">Buscar Material (SKU ou Descrição)</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-9 pr-24 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="O que você precisa?"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button 
                    onClick={handleAiSearch} 
                    disabled={isSearchingAI || !itemSearch}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1 hover:bg-indigo-200 disabled:opacity-50"
                  >
                    {isSearchingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    IA
                  </button>
                </div>

                {itemSearch && !selectedMaterial && filteredMaterials.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredMaterials.slice(0, 10).map((mat) => (
                      <button
                        key={mat.sku}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setSelectedMaterial(mat);
                          setItemSearch(mat.description);
                          setAiReasoning(null);
                        }}
                      >
                        <span className="font-semibold text-blue-600">{mat.sku}</span> - {mat.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={handleAddItem}
                  disabled={!selectedMaterial || quantity < 1}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Adicionar
                </button>
              </div>
            </div>

            {aiReasoning && (
              <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1 bg-indigo-50/50 p-2 rounded animate-in slide-in-from-top-1">
                <Sparkles className="w-3 h-3" />
                {aiReasoning}
              </div>
            )}
          </div>

          {cartItems.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qtd</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Remover</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">{item.material.sku}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{item.material.description}</td>
                      <td className="px-6 py-4 text-right text-sm text-slate-900 font-bold">{item.quantity} <span className="text-[10px] text-slate-400 uppercase">{item.material.unit}</span></td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg italic">
              Adicione itens acima para compor sua solicitação.
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedRig || !selectedSupervisor || !selectedEmployee || cartItems.length === 0}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-100 disabled:opacity-50 transition-all active:scale-95"
          >
            Finalizar e Enviar
          </button>
        </div>
      </div>
    </div>
  );
};