
import React, { useState, useEffect, useRef } from 'react';
import { Material, Employee, Rig, Admin, MaterialRequest } from '../types';
import { Database, UserPlus, HardHat, PackagePlus, Save, UserCog, Shield, AlertTriangle, Settings, Pencil, Trash2, X, Plus, Briefcase, Download, Upload, RefreshCcw, Cloud, RefreshCw } from 'lucide-react';
import { MATERIALS as DEFAULT_MATERIALS } from '../constants';

interface AdminDashboardProps {
  currentAdmin: Admin;
  // Data Lists
  materials: Material[];
  employees: Employee[];
  rigs: Rig[];
  admins: Admin[];
  roles: string[];
  requests?: MaterialRequest[]; // Optional just in case, but passed from App
  
  // Handlers
  onAddMaterial: (material: Material) => void;
  onUpdateMaterial: (oldSku: string, updatedMaterial: Material) => void;
  onDeleteMaterial: (sku: string) => void;

  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (oldId: string, updatedEmployee: Employee) => void;
  onDeleteEmployee: (id: string) => void;

  onAddRig: (rig: Rig) => void;
  onUpdateRig: (oldId: string, updatedRig: Rig) => void;
  onDeleteRig: (id: string) => void;

  onAddAdmin: (admin: Admin) => void;
  onUpdateAdmin: (originalId: string, updatedAdmin: Admin) => boolean;
  onDeleteAdmin: (id: string) => void;

  onAddRole: (role: string) => void;
  onDeleteRole: (role: string) => void;

  onImportDatabase: (data: any) => void;

  // Sync Props
  syncId: string;
  onSyncIdChange: (id: string) => void;
  onPerformSync: (isPush: boolean) => void;
  isSyncing: boolean;
}

type Tab = 'materials' | 'employees' | 'supervisors' | 'rigs' | 'admins' | 'settings' | 'roles' | 'backup' | 'cloud';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    currentAdmin, 
    materials, employees, rigs, admins, roles, requests,
    onAddMaterial, onUpdateMaterial, onDeleteMaterial,
    onAddEmployee, onUpdateEmployee, onDeleteEmployee,
    onAddRig, onUpdateRig, onDeleteRig,
    onAddAdmin, onUpdateAdmin, onDeleteAdmin,
    onAddRole, onDeleteRole,
    onImportDatabase,
    syncId, onSyncIdChange, onPerformSync, isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('materials');

  // Form States
  const [materialForm, setMaterialForm] = useState<Material>({ sku: '', description: '', unit: 'UN', category: 'Geral' });
  const [employeeForm, setEmployeeForm] = useState<Employee>({ id: '', name: '', role: roles[0] || 'Plataformista' });
  const [supervisorForm, setSupervisorForm] = useState<Employee>({ id: '', name: '', role: 'Supervisor' });
  const [rigForm, setRigForm] = useState<Rig>({ id: '', name: '', location: '' });
  const [adminForm, setAdminForm] = useState<Admin>({ id: '', name: '', role: 'COMMON', password: '' });
  
  // Role Management State
  const [newRole, setNewRole] = useState('');

  // Editing State (Track which ID is being edited to switch form mode)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Self Update State
  const [selfForm, setSelfForm] = useState<Admin>({ ...currentAdmin, password: '' }); // Don't prefill password
  const [confirmSelfPass, setConfirmSelfPass] = useState('');

  // Sync self form when currentAdmin changes (e.g. after update)
  useEffect(() => {
    setSelfForm({ ...currentAdmin, password: '' });
    setConfirmSelfPass('');
  }, [currentAdmin]);

  // Reset form and editing state when changing tabs
  useEffect(() => {
    setEditingId(null);
    setMaterialForm({ sku: '', description: '', unit: 'UN', category: 'Geral' });
    setEmployeeForm({ id: '', name: '', role: roles[0] || 'Plataformista' });
    setSupervisorForm({ id: '', name: '', role: 'Supervisor' });
    setRigForm({ id: '', name: '', location: '' });
    setAdminForm({ id: '', name: '', role: 'COMMON', password: '' });
    setNewRole('');
    setCapsLockOn(false);
  }, [activeTab]);

  const isMaster = currentAdmin.role === 'MASTER';

  // --- MATERIAL HANDLERS ---
  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (materialForm.sku && materialForm.description) {
      if (editingId) {
        onUpdateMaterial(editingId, materialForm);
        alert('Material atualizado com sucesso!');
        setEditingId(null);
      } else {
        onAddMaterial(materialForm);
        alert('Material adicionado com sucesso!');
      }
      setMaterialForm({ sku: '', description: '', unit: 'UN', category: 'Geral' });
    }
  };

  const handleEditMaterial = (m: Material) => {
      setMaterialForm(m);
      setEditingId(m.sku);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMaterialFromForm = () => {
    if (editingId && confirm(`Tem certeza que deseja excluir o material ${editingId}?`)) {
      onDeleteMaterial(editingId);
      setEditingId(null);
      setMaterialForm({ sku: '', description: '', unit: 'UN', category: 'Geral' });
    }
  };

  // --- EMPLOYEE HANDLERS ---
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeForm.id && employeeForm.name) {
      if (editingId) {
        onUpdateEmployee(editingId, employeeForm);
        alert('Colaborador atualizado com sucesso!');
        setEditingId(null);
      } else {
        onAddEmployee(employeeForm);
        alert('Colaborador adicionado com sucesso!');
      }
      setEmployeeForm({ id: '', name: '', role: roles[0] || 'Plataformista' });
    }
  };

  const handleEditEmployee = (e: Employee) => {
    setEmployeeForm(e);
    setEditingId(e.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEmployeeFromForm = () => {
    if (editingId && confirm(`Tem certeza que deseja excluir o colaborador ${editingId}?`)) {
      onDeleteEmployee(editingId);
      setEditingId(null);
      setEmployeeForm({ id: '', name: '', role: roles[0] || 'Plataformista' });
    }
  };

  // --- SUPERVISOR HANDLERS ---
  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supervisorForm.id && supervisorForm.name) {
      if (editingId) {
        // Update logic (preserve existing password if not changing)
        const existing = employees.find(emp => emp.id === editingId);
        onUpdateEmployee(editingId, { 
            ...supervisorForm, 
            role: 'Supervisor', 
            password: existing?.password 
        });
        alert('Supervisor atualizado com sucesso!');
        setEditingId(null);
      } else {
        // Create logic
        onAddEmployee({ 
            ...supervisorForm, 
            role: 'Supervisor',
            password: 'prrecv' 
        });
        alert('Supervisor cadastrado com sucesso! A senha padrão inicial é "prrecv".');
      }
      setSupervisorForm({ id: '', name: '', role: 'Supervisor' });
    }
  };

  const handleEditSupervisor = (s: Employee) => {
    setSupervisorForm(s);
    setEditingId(s.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSupervisorFromForm = () => {
    if (editingId && confirm(`Tem certeza que deseja excluir o supervisor ${editingId}?`)) {
      onDeleteEmployee(editingId);
      setEditingId(null);
      setSupervisorForm({ id: '', name: '', role: 'Supervisor' });
    }
  };

  // --- RIG HANDLERS ---
  const handleRigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rigForm.id && rigForm.name) {
      if (editingId) {
        onUpdateRig(editingId, rigForm);
        alert('Sonda atualizada com sucesso!');
        setEditingId(null);
      } else {
        onAddRig(rigForm);
        alert('Sonda adicionada com sucesso!');
      }
      setRigForm({ id: '', name: '', location: '' });
    }
  };

  const handleEditRig = (r: Rig) => {
    setRigForm(r);
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRigFromForm = () => {
    if (editingId && confirm(`Tem certeza que deseja excluir a sonda ${editingId}?`)) {
      onDeleteRig(editingId);
      setEditingId(null);
      setRigForm({ id: '', name: '', location: '' });
    }
  };

  // --- ADMIN HANDLERS ---
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminForm.id && adminForm.name) {
      if (editingId) {
        // Updating
        const success = onUpdateAdmin(editingId, adminForm);
        if (success) {
             alert('Administrador atualizado com sucesso!');
             setEditingId(null);
             setAdminForm({ id: '', name: '', role: 'COMMON', password: '' });
        }
      } else {
        // Creating
        if (adminForm.password) {
            onAddAdmin(adminForm);
            alert('Novo Administrador cadastrado com sucesso!');
            setAdminForm({ id: '', name: '', role: 'COMMON', password: '' });
        } else {
            alert("Senha é obrigatória para novos administradores.");
        }
      }
    }
  };

  const handleEditAdmin = (a: Admin) => {
    setAdminForm(a);
    setEditingId(a.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAdminFromForm = () => {
    if (editingId && confirm(`Tem certeza que deseja excluir o administrador ${editingId}?`)) {
        if (editingId === currentAdmin.id) {
            alert("Você não pode excluir sua própria conta enquanto estiver logado.");
            return;
        }
        onDeleteAdmin(editingId);
        setEditingId(null);
        setAdminForm({ id: '', name: '', role: 'COMMON', password: '' });
    }
  };

  // --- ROLE HANDLERS ---
  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole && !roles.includes(newRole)) {
        onAddRole(newRole);
        setNewRole('');
    } else if (roles.includes(newRole)) {
        alert('Este cargo já existe.');
    }
  };

  // --- BACKUP HANDLERS ---
  const handleExportBackup = () => {
    const backupData = {
        materials,
        employees,
        rigs,
        admins,
        roles,
        requests: requests || [],
        exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sondalog_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            // Basic validation
            if (!json.materials || !json.employees) {
                throw new Error("Formato de arquivo inválido.");
            }
            if (confirm("ATENÇÃO: Isso irá substituir TODOS os dados atuais pelos dados do backup. Deseja continuar?")) {
                onImportDatabase(json);
            }
        } catch (err) {
            alert("Erro ao ler arquivo de backup: " + err);
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleResetMaterials = () => {
    if (confirm("Deseja resetar a lista de materiais para a versão padrão do sistema? Isso substituirá sua lista atual.")) {
        onImportDatabase({
            materials: DEFAULT_MATERIALS,
            employees,
            rigs,
            admins,
            roles,
            requests
        });
        alert("Lista de materiais resetada com sucesso!");
    }
  }

  // --- SELF UPDATE ---
  const handleSelfUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selfForm.password && selfForm.password !== confirmSelfPass) {
        alert("A confirmação de senha não confere.");
        return;
    }
    
    // Use existing password if input is empty
    const updatedAdminData: Admin = {
        ...selfForm,
        password: selfForm.password || (currentAdmin.password as string)
    };

    const success = onUpdateAdmin(currentAdmin.id, updatedAdminData);
    if (success) {
        alert("Seus dados foram atualizados com sucesso!");
    }
  };

  const CancelEditButton = () => (
      editingId ? (
          <button 
            type="button" 
            onClick={() => { setEditingId(null); }}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 ml-4 underline"
          >
             <X className="w-3 h-3" /> Cancelar Edição
          </button>
      ) : null
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
            activeTab === 'materials' 
              ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <PackagePlus className="w-4 h-4" /> Materiais
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
            activeTab === 'employees' 
              ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Colaboradores
        </button>
        
        {/* Master Only Tabs */}
        {isMaster && (
          <>
            <button
              onClick={() => setActiveTab('supervisors')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'supervisors' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserCog className="w-4 h-4" /> Supervisores
            </button>
            <button
              onClick={() => setActiveTab('rigs')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'rigs' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <HardHat className="w-4 h-4" /> Sondas
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'roles' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Cargos
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'admins' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" /> Administradores
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'backup' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" /> Backup
            </button>
            <button
              onClick={() => setActiveTab('cloud')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'cloud' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Cloud className="w-4 h-4" /> Nuvem
            </button>
          </>
        )}

        {/* Settings Tab - For ALL Admins */}
        <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ml-auto ${
            activeTab === 'settings' 
                ? 'bg-white border border-b-0 border-slate-200 text-slate-800' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
        >
            <Settings className="w-4 h-4" /> Meus Dados
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <>
            <form onSubmit={handleMaterialSubmit} className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-500" />
                {editingId ? 'Editar Material' : 'Cadastrar Novo Material'}
                <CancelEditButton />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Código)</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: FER-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={materialForm.sku}
                    onChange={e => setMaterialForm({...materialForm, sku: e.target.value})}
                    disabled={!!editingId} // Disable SKU editing as it's often the ID
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={materialForm.unit}
                    onChange={e => setMaterialForm({...materialForm, unit: e.target.value})}
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="KG">Quilo (KG)</option>
                    <option value="MT">Metro (MT)</option>
                    <option value="L">Litro (L)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="PAR">Par (PAR)</option>
                    <option value="SC">Saco (SC)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Chave de Fenda Philips 3/8"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={materialForm.description}
                    onChange={e => setMaterialForm({...materialForm, description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Ferramentas Manuais"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={materialForm.category}
                    onChange={e => setMaterialForm({...materialForm, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                  <Save className="w-4 h-4" /> {editingId ? 'Salvar Alterações' : 'Cadastrar Material'}
                </button>
                
                {/* Delete Button in Edit Mode (MASTER Only) */}
                {editingId && isMaster && (
                  <button 
                    type="button"
                    onClick={handleDeleteMaterialFromForm}
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Material
                  </button>
                )}
              </div>
            </form>

            <div className="border-t border-slate-100 pt-6">
                <h4 className="font-medium text-slate-700 mb-4">Materiais Cadastrados ({materials.length})</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-2">SKU</th>
                                <th className="px-4 py-2">Descrição</th>
                                <th className="px-4 py-2">Categoria</th>
                                <th className="px-4 py-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {materials.map(m => (
                                <tr key={m.sku} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 font-mono text-slate-600">{m.sku}</td>
                                    <td className="px-4 py-2">{m.description}</td>
                                    <td className="px-4 py-2 text-slate-500">{m.category}</td>
                                    <td className="px-4 py-2 text-right space-x-2">
                                        <button onClick={() => handleEditMaterial(m)} className="text-blue-600 hover:text-blue-800" title="Editar">
                                            <Pencil className="w-4 h-4 inline" />
                                        </button>
                                        {isMaster && (
                                            <button 
                                                onClick={() => { if(confirm('Tem certeza que deseja excluir?')) onDeleteMaterial(m.sku) }} 
                                                className="text-red-600 hover:text-red-800" 
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </>
        )}

        {/* Cloud Tab - Sync Settings */}
        {activeTab === 'cloud' && isMaster && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-blue-500" />
                        Sincronização em Nuvem (Multi-Dispositivo)
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Gerencie a conexão deste dispositivo com a nuvem para permitir que outros dispositivos (como o tablet do supervisor) vejam as solicitações em tempo real.
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Chave da Empresa / Grupo</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border border-slate-300 rounded-md font-mono uppercase"
                                placeholder="Ex: RECV-SONDAS-2024"
                                value={syncId}
                                onChange={(e) => onSyncIdChange(e.target.value.toUpperCase().replace(/\s/g, '-'))}
                            />
                        </div>
                        <button 
                            onClick={() => { onPerformSync(true); alert('Dados enviados com sucesso!'); }}
                            disabled={!syncId || isSyncing}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Enviar Dados p/ Nuvem
                        </button>
                    </div>
                    <p className="mt-4 text-xs text-slate-400">
                        * Todos os dispositivos usando a mesma chave compartilharão as solicitações e dados automaticamente.
                    </p>
                </div>
            </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <>
            <form onSubmit={handleEmployeeSubmit} className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-500" />
                {editingId ? 'Editar Colaborador' : 'Cadastrar Colaborador (Geral)'}
                <CancelEditButton />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula (ID)</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: 1168"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={employeeForm.id}
                    onChange={e => setEmployeeForm({...employeeForm, id: e.target.value})}
                    disabled={!!editingId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={employeeForm.role}
                    onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}
                  >
                    {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input
                    required
                    type="text"
                    placeholder="Nome do colaborador"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={employeeForm.name}
                    onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                  <Save className="w-4 h-4" /> {editingId ? 'Salvar Alterações' : 'Salvar Colaborador'}
                </button>
                {/* Delete Button in Edit Mode (MASTER Only) */}
                {editingId && isMaster && (
                  <button 
                    type="button"
                    onClick={handleDeleteEmployeeFromForm}
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Colaborador
                  </button>
                )}
              </div>
            </form>

            <div className="border-t border-slate-100 pt-6">
                <h4 className="font-medium text-slate-700 mb-4">Colaboradores Cadastrados ({employees.length})</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-2">Matrícula</th>
                                <th className="px-4 py-2">Nome</th>
                                <th className="px-4 py-2">Cargo</th>
                                <th className="px-4 py-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 font-mono text-slate-600">{e.id}</td>
                                    <td className="px-4 py-2">{e.name}</td>
                                    <td className="px-4 py-2 text-slate-500">{e.role}</td>
                                    <td className="px-4 py-2 text-right space-x-2">
                                        <button onClick={() => handleEditEmployee(e)} className="text-blue-600 hover:text-blue-800" title="Editar">
                                            <Pencil className="w-4 h-4 inline" />
                                        </button>
                                        {isMaster && (
                                            <button 
                                                onClick={() => { if(confirm('Tem certeza que deseja excluir?')) onDeleteEmployee(e.id) }} 
                                                className="text-red-600 hover:text-red-800" 
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </>
        )}
        
        {/* supervisor form tab remains same but simplified in this snippet */}
        {activeTab === 'supervisors' && isMaster && (
          <>
            <form onSubmit={handleSupervisorSubmit} className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-slate-500" />
                  {editingId ? 'Editar Supervisor' : 'Cadastrar Novo Supervisor'}
                  <CancelEditButton />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                    <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md" value={supervisorForm.id} onChange={e => setSupervisorForm({...supervisorForm, id: e.target.value})} disabled={!!editingId} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md" value={supervisorForm.name} onChange={e => setSupervisorForm({...supervisorForm, name: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
            </form>

            <div className="border-t border-slate-100 pt-6">
                <h4 className="font-medium text-slate-700 mb-4">Supervisores Cadastrados ({employees.filter(e => e.role.toUpperCase().includes('SUPERVISOR')).length})</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-2">Matrícula</th>
                                <th className="px-4 py-2">Nome</th>
                                <th className="px-4 py-2">Cargo Específico</th>
                                <th className="px-4 py-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.filter(e => e.role.toUpperCase().includes('SUPERVISOR')).map(e => (
                                <tr key={e.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 font-mono text-slate-600">{e.id}</td>
                                    <td className="px-4 py-2">{e.name}</td>
                                    <td className="px-4 py-2 text-slate-500">{e.role}</td>
                                    <td className="px-4 py-2 text-right space-x-2">
                                        <button onClick={() => handleEditSupervisor(e)} className="text-blue-600 hover:text-blue-800" title="Editar">
                                            <Pencil className="w-4 h-4 inline" />
                                        </button>
                                        {isMaster && (
                                            <button 
                                                onClick={() => { if(confirm('Tem certeza que deseja excluir?')) onDeleteEmployee(e.id) }} 
                                                className="text-red-600 hover:text-red-800" 
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </>
        )}

        {activeTab === 'rigs' && isMaster && (
           <>
            <form onSubmit={handleRigSubmit} className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-slate-500" />
                  {editingId ? 'Editar Sonda' : 'Cadastrar Nova Sonda'}
                  <CancelEditButton />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID da Sonda</label>
                    <input required type="text" placeholder="Ex: S01" className="w-full px-3 py-2 border border-slate-300 rounded-md" value={rigForm.id} onChange={e => setRigForm({...rigForm, id: e.target.value})} disabled={!!editingId} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Sonda</label>
                    <input required type="text" placeholder="Ex: Sonda Alpha 01" className="w-full px-3 py-2 border border-slate-300 rounded-md" value={rigForm.name} onChange={e => setRigForm({...rigForm, name: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
                    <input required type="text" placeholder="Ex: Bacia de Campos" className="w-full px-3 py-2 border border-slate-300 rounded-md" value={rigForm.location} onChange={e => setRigForm({...rigForm, location: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
            </form>
            <div className="border-t border-slate-100 pt-6">
                <h4 className="font-medium text-slate-700 mb-4">Sondas Cadastradas ({rigs.length})</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Nome</th>
                                <th className="px-4 py-2">Localização</th>
                                <th className="px-4 py-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rigs.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 font-mono text-slate-600">{r.id}</td>
                                    <td className="px-4 py-2 font-semibold">{r.name}</td>
                                    <td className="px-4 py-2 text-slate-500">{r.location}</td>
                                    <td className="px-4 py-2 text-right space-x-2">
                                        <button onClick={() => handleEditRig(r)} className="text-blue-600 hover:text-blue-800" title="Editar">
                                            <Pencil className="w-4 h-4 inline" />
                                        </button>
                                        <button onClick={() => { if(confirm('Excluir sonda?')) onDeleteRig(r.id) }} className="text-red-600 hover:text-red-800" title="Excluir">
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
           </>
        )}

        {activeTab === 'roles' && isMaster && (
            <>
                <form onSubmit={handleAddRoleSubmit} className="flex gap-2 mb-6">
                    <input required type="text" placeholder="Novo cargo..." className="flex-1 px-3 py-2 border rounded-md" value={newRole} onChange={e => setNewRole(e.target.value)} />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Cargo
                    </button>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {roles.map(role => (
                        <div key={role} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                            <span className="text-sm font-medium">{role}</span>
                            <button onClick={() => { if(confirm('Excluir este cargo?')) onDeleteRole(role) }} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </>
        )}

        {activeTab === 'admins' && isMaster && (
            <>
                <form onSubmit={handleAdminSubmit} className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-slate-500" />
                        {editingId ? 'Editar Administrador' : 'Cadastrar Novo Administrador'}
                        <CancelEditButton />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário (Login)</label>
                            <input required type="text" className="w-full px-3 py-2 border rounded-md" value={adminForm.id} onChange={e => setAdminForm({...adminForm, id: e.target.value})} disabled={!!editingId} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                            <input required type="text" className="w-full px-3 py-2 border rounded-md" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Acesso</label>
                            <select className="w-full px-3 py-2 border rounded-md" value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value as any})}>
                                <option value="COMMON">Comum (Almoxarife)</option>
                                <option value="MASTER">Master (Controle Total)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{editingId ? 'Senha (Em branco p/ manter)' : 'Senha'}</label>
                            <input type="password" required={!editingId} className="w-full px-3 py-2 border rounded-md" value={adminForm.password || ''} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                        </div>
                    </div>
                    <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
                </form>
                <div className="border-t pt-6">
                    <h4 className="font-medium mb-4 text-slate-700">Administradores Sistema</h4>
                    <div className="grid gap-4">
                        {admins.map(a => (
                            <div key={a.id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                <div>
                                    <p className="font-bold">{a.name} <span className="text-xs font-normal text-slate-400">@{a.id}</span></p>
                                    <p className="text-xs uppercase font-bold text-blue-600">{a.role}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditAdmin(a)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => { if(confirm('Excluir administrador?')) onDeleteAdmin(a.id) }} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'backup' && isMaster && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-xl bg-slate-50">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Download className="w-5 h-5" /> Exportar Dados
                        </h4>
                        <p className="text-sm text-slate-500 mb-4">Baixe um arquivo JSON contendo todos os materiais, colaboradores, sondas e solicitações atuais.</p>
                        <button onClick={handleExportBackup} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">Baixar JSON</button>
                    </div>
                    <div className="p-6 border rounded-xl bg-slate-50">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Upload className="w-5 h-5" /> Importar Backup
                        </h4>
                        <p className="text-sm text-slate-500 mb-4">Restaure o sistema a partir de um arquivo JSON. Isso apagará todos os dados atuais permanentemente.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                        <button onClick={handleImportClick} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors">Carregar Arquivo</button>
                    </div>
                </div>
                <div className="p-6 border border-amber-100 rounded-xl bg-amber-50">
                    <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5" /> Resetar Banco de Dados
                    </h4>
                    <p className="text-sm text-amber-700 mb-4">Restaura apenas a lista de materiais padrão (EPIs iniciais). Colaboradores e sondas não serão afetados.</p>
                    <button onClick={handleResetMaterials} className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors">Resetar Materiais</button>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSelfUpdateSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              Configurações da Minha Conta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-md" value={selfForm.name} onChange={e => setSelfForm({...selfForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID / Usuário</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-md bg-slate-50" value={selfForm.id} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                <input type="password" placeholder="Mínimo 4 caracteres" className="w-full px-3 py-2 border rounded-md" value={selfForm.password || ''} onChange={e => setSelfForm({...selfForm, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                <input type="password" placeholder="Digite novamente" className="w-full px-3 py-2 border rounded-md" value={confirmSelfPass} onChange={e => setConfirmSelfPass(e.target.value)} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">* Deixe os campos de senha em branco se desejar manter a senha atual.</p>
            <button type="submit" className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-md font-bold shadow-md hover:bg-slate-900 transition-colors">Atualizar Meus Dados</button>
          </form>
        )}
      </div>
    </div>
  );
};
