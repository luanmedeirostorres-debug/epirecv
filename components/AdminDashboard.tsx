import React, { useState, useEffect } from 'react';
import { Material, Employee, Rig, Admin } from '../types';
import { Database, UserPlus, HardHat, PackagePlus, Save, UserCog, Shield, AlertTriangle, Settings } from 'lucide-react';

interface AdminDashboardProps {
  currentAdmin: Admin;
  onAddMaterial: (material: Material) => void;
  onAddEmployee: (employee: Employee) => void;
  onAddRig: (rig: Rig) => void;
  onAddAdmin: (admin: Admin) => void;
  onUpdateAdmin: (originalId: string, updatedAdmin: Admin) => boolean;
}

type Tab = 'materials' | 'employees' | 'supervisors' | 'rigs' | 'admins' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentAdmin, onAddMaterial, onAddEmployee, onAddRig, onAddAdmin, onUpdateAdmin }) => {
  const [activeTab, setActiveTab] = useState<Tab>('materials');

  // Form States
  const [materialForm, setMaterialForm] = useState<Material>({ sku: '', description: '', unit: 'UN', category: 'Geral' });
  const [employeeForm, setEmployeeForm] = useState<Employee>({ id: '', name: '', role: 'Plataformista' });
  const [supervisorForm, setSupervisorForm] = useState<Employee>({ id: '', name: '', role: 'Supervisor' });
  const [rigForm, setRigForm] = useState<Rig>({ id: '', name: '', location: '' });
  const [adminForm, setAdminForm] = useState<Admin>({ id: '', name: '', role: 'COMMON', password: '' });

  // Self Update State
  const [selfForm, setSelfForm] = useState<Admin>({ ...currentAdmin, password: '' }); // Don't prefill password
  const [confirmSelfPass, setConfirmSelfPass] = useState('');

  // Sync self form when currentAdmin changes (e.g. after update)
  useEffect(() => {
    setSelfForm({ ...currentAdmin, password: '' });
    setConfirmSelfPass('');
  }, [currentAdmin]);

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (materialForm.sku && materialForm.description) {
      onAddMaterial(materialForm);
      setMaterialForm({ sku: '', description: '', unit: 'UN', category: 'Geral' });
      alert('Material adicionado com sucesso!');
    }
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeForm.id && employeeForm.name) {
      onAddEmployee(employeeForm);
      setEmployeeForm({ id: '', name: '', role: 'Plataformista' });
      alert('Colaborador adicionado com sucesso!');
    }
  };

  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supervisorForm.id && supervisorForm.name) {
      // Force role to be Supervisor and set a default password
      onAddEmployee({ 
        ...supervisorForm, 
        role: 'Supervisor',
        password: 'prrecv' // Senha padrão inicial atualizada
      });
      setSupervisorForm({ id: '', name: '', role: 'Supervisor' });
      alert('Supervisor cadastrado com sucesso! A senha padrão inicial é "prrecv".');
    }
  };

  const handleRigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rigForm.id && rigForm.name) {
      onAddRig(rigForm);
      setRigForm({ id: '', name: '', location: '' });
      alert('Sonda adicionada com sucesso!');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminForm.id && adminForm.name && adminForm.password) {
      onAddAdmin(adminForm);
      setAdminForm({ id: '', name: '', role: 'COMMON', password: '' });
      alert('Novo Administrador cadastrado com sucesso!');
    }
  };

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

  const isMaster = currentAdmin.role === 'MASTER';

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
          <PackagePlus className="w-4 h-4" /> Materiais (SKUs)
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
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === 'admins' 
                  ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" /> Administradores
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
        
        {/* Materials Form */}
        {activeTab === 'materials' && (
          <form onSubmit={handleMaterialSubmit} className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              Cadastrar Novo Material
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
            <div className="pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> Salvar Material
              </button>
            </div>
          </form>
        )}

        {/* Employees Form */}
        {activeTab === 'employees' && (
          <form onSubmit={handleEmployeeSubmit} className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              Cadastrar Colaborador (Geral)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula (ID)</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: MAT999"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={employeeForm.id}
                  onChange={e => setEmployeeForm({...employeeForm, id: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={employeeForm.role}
                  onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}
                >
                  <option value="Plataformista">Plataformista</option>
                  <option value="Torrista">Torrista</option>
                  <option value="Sondador">Sondador</option>
                  <option value="Mecânico">Mecânico</option>
                  <option value="Eletricista">Eletricista</option>
                  <option value="Gerente">Gerente</option>
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
            <div className="pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> Salvar Colaborador
              </button>
            </div>
          </form>
        )}

        {/* Supervisors Form - MASTER ONLY */}
        {activeTab === 'supervisors' && isMaster && (
          <form onSubmit={handleSupervisorSubmit} className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-slate-500" />
              Cadastrar Novo Supervisor
            </h3>
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800 mb-2">
              Supervisores cadastrados aqui terão acesso ao Painel do Supervisor. <br/>
              <b>Uma senha inicial padrão ("prrecv") será definida automaticamente.</b>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula (ID do Supervisor)</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: SUP005"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={supervisorForm.id}
                  onChange={e => setSupervisorForm({...supervisorForm, id: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <div className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-md">
                   Supervisor
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  placeholder="Nome do supervisor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={supervisorForm.name}
                  onChange={e => setSupervisorForm({...supervisorForm, name: e.target.value})}
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> Salvar Supervisor
              </button>
            </div>
          </form>
        )}

        {/* Rigs Form - MASTER ONLY */}
        {activeTab === 'rigs' && isMaster && (
          <form onSubmit={handleRigSubmit} className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              Cadastrar Nova Sonda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID da Sonda</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: S99"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={rigForm.id}
                  onChange={e => setRigForm({...rigForm, id: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Sonda</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Sonda Delta 04"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={rigForm.name}
                  onChange={e => setRigForm({...rigForm, name: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Bacia de Campos - RJ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={rigForm.location}
                  onChange={e => setRigForm({...rigForm, location: e.target.value})}
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> Salvar Sonda
              </button>
            </div>
          </form>
        )}

        {/* Admins Form - MASTER ONLY */}
        {activeTab === 'admins' && isMaster && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-500" />
              Cadastrar Novo Administrador
            </h3>
            <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm text-amber-800 mb-2 flex items-start gap-2">
               <AlertTriangle className="w-4 h-4 mt-0.5" />
               <div>
                  <b>Atenção:</b> Administradores "Common" só podem gerenciar Materiais e Colaboradores. <br/>
                  Administradores "Master" têm acesso total ao sistema.
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuário / ID de Login</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: joao.admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adminForm.id}
                  onChange={e => setAdminForm({...adminForm, id: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Permissão</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adminForm.role}
                  onChange={e => setAdminForm({...adminForm, role: e.target.value as 'MASTER' | 'COMMON'})}
                >
                  <option value="COMMON">Administrador Comum (Restrito)</option>
                  <option value="MASTER">Administrador Master (Total)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  placeholder="Nome do administrador"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adminForm.name}
                  onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha de Acesso</label>
                <input
                  required
                  type="password"
                  placeholder="******"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adminForm.password}
                  onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> Salvar Administrador
              </button>
            </div>
          </form>
        )}

        {/* My Settings Form - FOR ALL ADMINS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSelfUpdateSubmit} className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              Configurações da Conta
            </h3>
            <div className="bg-slate-50 border border-slate-100 rounded-md p-3 text-sm text-slate-600 mb-2">
               Aqui você pode alterar suas credenciais de acesso. Se alterar o <b>ID de Login</b>, você precisará usar o novo ID na próxima vez que entrar.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuário / ID de Login</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selfForm.id}
                  onChange={e => setSelfForm({...selfForm, id: e.target.value})}
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selfForm.name}
                  onChange={e => setSelfForm({...selfForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selfForm.password || ''}
                  onChange={e => setSelfForm({...selfForm, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  placeholder="Confirme a senha se estiver alterando"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={confirmSelfPass}
                  onChange={e => setConfirmSelfPass(e.target.value)}
                  disabled={!selfForm.password}
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium transition-colors">
                <Save className="w-4 h-4" /> Atualizar Meus Dados
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};