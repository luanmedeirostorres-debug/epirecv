import React, { useState } from 'react';
import { Material, RequestItem, Rig, Employee } from '../types';
import { Plus, Trash2, Search, Package, User, MapPin, Sparkles, Loader2, ChevronDown, Check, X, Lock, UserCog } from 'lucide-react';
import { findMaterialWithAI } from '../services/aiService';

interface RequestFormProps {
  onSubmit: (rigId: string, employeeId: string, supervisorId: string, items: RequestItem[]) => void;
  rigs: Rig[];
  employees: Employee[];
  materials: Material[];
}

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, rigs, employees, materials }) => {
  const [selectedRig, setSelectedRig] = useState<Rig | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Employee | null>(null);
  
  // Search States for Dropdowns
  const [rigSearch, setRigSearch] = useState('');
  const [isRigOpen, setIsRigOpen] = useState(false);
  
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<RequestItem[]>([]);
  
  // Item Entry State
  const [itemSearch, setItemSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  // AI State
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Derived State for Flow Control
  const canAddItems = !!(selectedRig && selectedEmployee && selectedSupervisor);

  // Filter Logic
  const filteredRigs = rigs.filter(r => 
    r.name.toLowerCase().includes(rigSearch.toLowerCase()) || 
    r.id.toLowerCase().includes(rigSearch.toLowerCase())
  );

  const filteredEmployees = employees.filter(e => 
    (e.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
    e.id.toLowerCase().includes(employeeSearch.toLowerCase()))
  );
  
  // Filter Supervisors (only employees with role 'Supervisor')
  const supervisors = employees.filter(e => e.role === 'Supervisor');

  const handleSelectRig = (rig: Rig) => {
    setSelectedRig(rig);
    setRigSearch(rig.name);
    setIsRigOpen(false);
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(emp.name);
    setIsEmployeeOpen(false);
  };

  const clearRigSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRig(null);
    setRigSearch('');
    setIsRigOpen(false);
  };

  const clearEmployeeSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployee(null);
    setEmployeeSearch('');
    setIsEmployeeOpen(false);
  };

  const handleAddItem = () => {
    if (selectedMaterial && quantity > 0) {
      setCartItems([...cartItems, { material: selectedMaterial, quantity }]);
      // Reset item entry
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
    if (selectedRig && selectedEmployee && selectedSupervisor && cartItems.length > 0) {
      onSubmit(selectedRig.id, selectedEmployee.id, selectedSupervisor.id, cartItems);
      // Reset form
      setCartItems([]);
      setSelectedRig(null);
      setSelectedEmployee(null);
      setSelectedSupervisor(null);
      setRigSearch('');
      setEmployeeSearch('');
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
      } else {
        setAiReasoning("Não consegui encontrar um material correspondente no banco de dados.");
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
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Nova Solicitação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Rig Searchable Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sonda (Unidade) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className={`flex items-center w-full bg-slate-50 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all cursor-text ${selectedRig ? 'border-green-500 bg-green-50/30' : 'border-slate-300'}`}
                onClick={() => setIsRigOpen(true)}
              >
                <MapPin className={`w-5 h-5 ml-3 flex-shrink-0 ${selectedRig ? 'text-green-600' : 'text-slate-400'}`} />
                <input
                  type="text"
                  className="w-full pl-2 pr-8 py-2.5 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  placeholder="Buscar Sonda ou Código..."
                  value={rigSearch}
                  onChange={(e) => {
                    setRigSearch(e.target.value);
                    setIsRigOpen(true);
                    if (selectedRig && e.target.value !== selectedRig.name) setSelectedRig(null);
                  }}
                  onFocus={() => setIsRigOpen(true)}
                />
                <div className="absolute right-2 flex items-center">
                  {rigSearch && (
                    <button onClick={clearRigSelection} className="p-1 mr-1 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsRigOpen(!isRigOpen); }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isRigOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Rig Options List */}
              {isRigOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRigOpen(false)} />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
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

          {/* Employee Searchable Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Colaborador (Solicitante) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className={`flex items-center w-full bg-slate-50 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all cursor-text ${selectedEmployee ? 'border-green-500 bg-green-50/30' : 'border-slate-300'}`}
                onClick={() => setIsEmployeeOpen(true)}
              >
                <User className={`w-5 h-5 ml-3 flex-shrink-0 ${selectedEmployee ? 'text-green-600' : 'text-slate-400'}`} />
                <input
                  type="text"
                  className="w-full pl-2 pr-8 py-2.5 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  placeholder="Buscar Nome ou Matrícula..."
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setIsEmployeeOpen(true);
                    if (selectedEmployee && e.target.value !== selectedEmployee.name) setSelectedEmployee(null);
                  }}
                  onFocus={() => setIsEmployeeOpen(true)}
                />
                <div className="absolute right-2 flex items-center">
                  {employeeSearch && (
                    <button onClick={clearEmployeeSelection} className="p-1 mr-1 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEmployeeOpen(!isEmployeeOpen); }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isEmployeeOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Employee Options List */}
              {isEmployeeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsEmployeeOpen(false)} />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group"
                          onClick={() => handleSelectEmployee(emp)}
                        >
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-blue-700">{emp.name}</p>
                            <p className="text-xs text-slate-500">Mat: {emp.id} • {emp.role}</p>
                          </div>
                          {selectedEmployee?.id === emp.id && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-400 text-center">Nenhum colaborador encontrado.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Supervisor Selection (New Field) */}
          <div className="relative md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supervisor Responsável <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                 className={`flex items-center w-full bg-slate-50 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${selectedSupervisor ? 'border-green-500 bg-green-50/30' : 'border-slate-300'}`}
              >
                <UserCog className={`w-5 h-5 ml-3 flex-shrink-0 ${selectedSupervisor ? 'text-green-600' : 'text-slate-400'}`} />
                <select
                  className="w-full pl-2 pr-8 py-2.5 bg-transparent outline-none text-slate-900 cursor-pointer appearance-none"
                  value={selectedSupervisor?.id || ''}
                  onChange={(e) => {
                    const sup = supervisors.find(s => s.id === e.target.value);
                    setSelectedSupervisor(sup || null);
                  }}
                >
                  <option value="">Selecione um supervisor...</option>
                  {supervisors.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} (Mat: {sup.id})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Adicionar Materiais</h3>
             {!canAddItems && (
                 <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Preencha os dados acima
                 </span>
             )}
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 relative transition-all">
            
            <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-end ${!canAddItems ? 'opacity-40 pointer-events-none' : ''}`}>
              
              {/* Material Search */}
              <div className="md:col-span-6 relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Buscar Material (SKU ou Descrição)
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    disabled={!canAddItems}
                    className="w-full pl-9 pr-24 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                    placeholder="Ex: Luva, Parafuso..."
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      if (selectedMaterial && e.target.value !== selectedMaterial.description) {
                         setSelectedMaterial(null); // Clear selection if typing manually
                      }
                    }}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  
                  {/* AI Button */}
                  <button 
                    onClick={handleAiSearch}
                    disabled={isSearchingAI || !itemSearch || !canAddItems}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1 hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                    title="Usar IA para encontrar o material"
                  >
                    {isSearchingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    IA Help
                  </button>
                </div>

                {/* Dropdown for filtered results */}
                {itemSearch && !selectedMaterial && filteredMaterials.length > 0 && !isSearchingAI && canAddItems && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredMaterials.map((mat) => (
                      <button
                        key={mat.sku}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-slate-700 border-b border-slate-50 last:border-0"
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

              {/* Quantity */}
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Quantidade
                </label>
                <div className="relative">
                    <input
                        type="number"
                        min="1"
                        disabled={!selectedMaterial || !canAddItems}
                        className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${!selectedMaterial ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    />
                    {!selectedMaterial && canAddItems && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-slate-400">Selecione item</span>
                        </div>
                    )}
                </div>
                {selectedMaterial && (
                    <span className="text-xs text-slate-500 mt-1 block">
                        Unidade: {selectedMaterial.unit}
                    </span>
                )}
              </div>

              {/* Add Button */}
              <div className="md:col-span-3">
                <button
                  onClick={handleAddItem}
                  disabled={!selectedMaterial || quantity < 1 || !canAddItems}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Incluir
                </button>
              </div>
            </div>
            
            {/* AI Reasoning Display */}
            {aiReasoning && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-md flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-800">{aiReasoning}</p>
              </div>
            )}
          </div>

          {/* Cart List */}
          {cartItems.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qtd</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {cartItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.material.sku}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{item.material.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.quantity} <span className="text-xs text-slate-400">{item.material.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
              Nenhum item adicionado à solicitação ainda.
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedRig || !selectedEmployee || !selectedSupervisor || cartItems.length === 0}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar para Supervisor
          </button>
        </div>
      </div>
    </div>
  );
};