import React, { useState, useEffect } from 'react';
import { RequestForm } from './components/RequestForm';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MaterialRequest, RequestItem, RequestStatus, Material, Employee, Rig, Admin } from './types';
import { LayoutDashboard, FileText, Drill, Menu, X, Lock, KeyRound, ShieldCheck, LogOut, AlertTriangle } from 'lucide-react';
import { RIGS as INITIAL_RIGS, EMPLOYEES as INITIAL_EMPLOYEES, MATERIALS as INITIAL_MATERIALS, ADMINS as INITIAL_ADMINS, INITIAL_ROLES } from './constants';

type ViewState = 'form' | 'dashboard' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database State with Persistence
  const [rigs, setRigs] = useState<Rig[]>(() => {
    const saved = localStorage.getItem('sondalog_rigs');
    return saved ? JSON.parse(saved) : INITIAL_RIGS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('sondalog_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('sondalog_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [admins, setAdmins] = useState<Admin[]>(() => {
    const saved = localStorage.getItem('sondalog_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  const [roles, setRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem('sondalog_roles');
    return saved ? JSON.parse(saved) : INITIAL_ROLES;
  });

  const [requests, setRequests] = useState<MaterialRequest[]>(() => {
    const saved = localStorage.getItem('sondalog_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('sondalog_rigs', JSON.stringify(rigs));
  }, [rigs]);

  useEffect(() => {
    localStorage.setItem('sondalog_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('sondalog_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('sondalog_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('sondalog_roles', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('sondalog_requests', JSON.stringify(requests));
  }, [requests]);

  // Auth State
  const [authenticatedSupervisorId, setAuthenticatedSupervisorId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetViewForLogin, setTargetViewForLogin] = useState<ViewState>('form'); 
  
  // Login Form State
  const [loginUser, setLoginUser] = useState(''); 
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // --- Database Management Functions ---
  const handleImportDatabase = (data: any) => {
    if (data.materials) setMaterials(data.materials);
    if (data.employees) setEmployees(data.employees);
    if (data.rigs) setRigs(data.rigs);
    if (data.admins) setAdmins(data.admins);
    if (data.roles) setRoles(data.roles);
    if (data.requests) setRequests(data.requests);
    alert('Banco de dados restaurado com sucesso!');
  };

  const handleAddRole = (role: string) => { if (!roles.includes(role)) setRoles([...roles, role]); };
  const handleDeleteRole = (role: string) => setRoles(roles.filter(r => r !== role));

  const handleAddMaterial = (material: Material) => setMaterials([...materials, material]);
  const handleUpdateMaterial = (oldSku: string, updatedMaterial: Material) => setMaterials(materials.map(m => m.sku === oldSku ? updatedMaterial : m));
  const handleDeleteMaterial = (sku: string) => setMaterials(materials.filter(m => m.sku !== sku));

  const handleAddEmployee = (employee: Employee) => setEmployees([...employees, employee]);
  const handleUpdateEmployee = (oldId: string, updatedEmployee: Employee) => setEmployees(employees.map(e => e.id === oldId ? updatedEmployee : e));
  const handleDeleteEmployee = (id: string) => setEmployees(employees.filter(e => e.id !== id));

  const handleAddRig = (rig: Rig) => setRigs([...rigs, rig]);
  const handleUpdateRig = (oldId: string, updatedRig: Rig) => setRigs(rigs.map(r => r.id === oldId ? updatedRig : r));
  const handleDeleteRig = (id: string) => setRigs(rigs.filter(r => r.id !== id));

  const handleAddAdmin = (admin: Admin) => setAdmins([...admins, admin]);
  const handleUpdateAdmin = (originalId: string, updatedAdmin: Admin) => {
    if (originalId !== updatedAdmin.id && admins.some(a => a.id === updatedAdmin.id)) {
      alert("Este ID de login já está em uso.");
      return false;
    }
    setAdmins(admins.map(a => a.id === originalId ? updatedAdmin : a));
    if (currentAdmin && currentAdmin.id === originalId) setCurrentAdmin(updatedAdmin);
    return true;
  };
  const handleDeleteAdmin = (id: string) => {
    if (admins.length <= 1) { alert("Não é possível excluir o último administrador."); return; }
    setAdmins(admins.filter(a => a.id !== id));
  };

  // --- Request Management Functions ---
  const handleCreateRequest = (rigId: string, employeeId: string, supervisorId: string, items: RequestItem[]) => {
    const newRequest: MaterialRequest = {
      id: Math.random().toString(36).substr(2, 9),
      rigId,
      employeeId,
      supervisorId,
      items,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    setRequests([newRequest, ...requests]);
    const supervisor = employees.find(e => e.id === supervisorId);
    alert(`Solicitação enviada para análise de ${supervisor?.name || supervisorId}!`);
  };

  const handleUpdateStatus = (id: string, status: RequestStatus) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status } : req));
  };

  const handleUpdateItems = (id: string, items: RequestItem[]) => {
    setRequests(requests.map(req => req.id === id ? { ...req, items } : req));
  };

  const handleDeleteRequest = (id: string) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  const handleSupervisorPasswordChange = (newPassword: string) => {
    if (!authenticatedSupervisorId) return;
    setEmployees(employees.map(emp => emp.id === authenticatedSupervisorId ? { ...emp, password: newPassword } : emp));
  };

  // Navigation
  const handlePublicNavigation = () => { setAuthenticatedSupervisorId(null); setCurrentAdmin(null); setCurrentView('form'); setIsMobileMenuOpen(false); };

  const handleProtectedNavigation = (target: ViewState) => {
    setCapsLockOn(false);
    if (target === 'dashboard') {
      if (currentAdmin) setCurrentAdmin(null);
      if (authenticatedSupervisorId) setCurrentView('dashboard');
      else { setTargetViewForLogin('dashboard'); setShowLoginModal(true); setLoginError(false); setLoginUser(''); setPasswordInput(''); }
    } else if (target === 'admin') {
      if (authenticatedSupervisorId) setAuthenticatedSupervisorId(null);
      if (currentAdmin) setCurrentView('admin');
      else { setTargetViewForLogin('admin'); setShowLoginModal(true); setLoginError(false); setLoginUser(''); setPasswordInput(''); }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => { setAuthenticatedSupervisorId(null); setCurrentAdmin(null); setCurrentView('form'); };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetViewForLogin === 'dashboard') {
      const supervisor = employees.find(e => e.id === loginUser && e.role === 'Supervisor');
      if (supervisor && supervisor.password && passwordInput === supervisor.password) { setAuthenticatedSupervisorId(loginUser); setCurrentView('dashboard'); setShowLoginModal(false); }
      else setLoginError(true);
    } else if (targetViewForLogin === 'admin') {
      const admin = admins.find(a => a.id === loginUser);
      if (admin && admin.password === passwordInput) { setCurrentAdmin(admin); setCurrentView('admin'); setShowLoginModal(false); }
      else setLoginError(true);
    }
  };

  const supervisors = employees.filter(e => e.role === 'Supervisor');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg"><Drill className="h-6 w-6" /></div>
            <div>
              <span className="font-bold text-lg tracking-tight">SondaLog</span>
              <span className="text-[10px] text-slate-400 block -mt-1 uppercase tracking-widest font-bold">RECV Oil & Gas</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={handlePublicNavigation} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'form' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Solicitar Material</button>
            <button onClick={() => handleProtectedNavigation('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Painel Supervisor</button>
            <button onClick={() => handleProtectedNavigation('admin')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Admin</button>
            {(authenticatedSupervisorId || currentAdmin) && <button onClick={handleLogout} className="ml-4 p-2 text-red-300 hover:bg-red-900/30 rounded-md transition-colors"><LogOut className="w-4 h-4" /></button>}
          </div>
          <div className="md:hidden"><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400 hover:text-white"><Menu className="h-6 w-6" /></button></div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 p-4 space-y-2">
            <button onClick={handlePublicNavigation} className="block w-full text-left py-2 text-slate-300">Nova Solicitação</button>
            <button onClick={() => handleProtectedNavigation('dashboard')} className="block w-full text-left py-2 text-slate-300">Painel Supervisor</button>
            <button onClick={() => handleProtectedNavigation('admin')} className="block w-full text-left py-2 text-slate-300">Painel Admin</button>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {currentView === 'form' && <RequestForm onSubmit={handleCreateRequest} rigs={rigs} employees={employees} materials={materials} />}
        {currentView === 'dashboard' && authenticatedSupervisorId && <SupervisorDashboard requests={requests.filter(req => req.supervisorId === authenticatedSupervisorId)} onUpdateStatus={handleUpdateStatus} onUpdateItems={handleUpdateItems} onDeleteRequest={handleDeleteRequest} rigs={rigs} employees={employees} onChangePassword={handleSupervisorPasswordChange} />}
        {currentView === 'admin' && currentAdmin && <AdminDashboard currentAdmin={currentAdmin} materials={materials} employees={employees} rigs={rigs} admins={admins} roles={roles} requests={requests} onAddMaterial={handleAddMaterial} onUpdateMaterial={handleUpdateMaterial} onDeleteMaterial={handleDeleteMaterial} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} onAddRig={handleAddRig} onUpdateRig={handleUpdateRig} onDeleteRig={handleDeleteRig} onAddAdmin={handleAddAdmin} onUpdateAdmin={handleUpdateAdmin} onDeleteAdmin={handleDeleteAdmin} onAddRole={handleAddRole} onDeleteRole={handleDeleteRole} onImportDatabase={handleImportDatabase} />}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 text-center mb-6">{targetViewForLogin === 'admin' ? 'Acesso Administrativo' : 'Login de Supervisor'}</h3>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {targetViewForLogin === 'dashboard' ? (
                <select className="w-full px-3 py-2 border rounded-lg" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} required>
                  <option value="">Selecione seu usuário...</option>
                  {supervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                </select>
              ) : (
                <input type="text" className="w-full px-4 py-2 border rounded-lg" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Usuário Admin" required />
              )}
              <input type="password" placeholder="Senha" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${loginError ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2 border rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t p-6 text-center text-sm text-slate-400">© 2024 SondaLog Oil & Gas RECV.</footer>
    </div>
  );
};

export default App;