import React, { useState, useEffect, useCallback } from 'react';
import { RequestForm } from './components/RequestForm';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MaterialRequest, RequestItem, RequestStatus, Material, Employee, Rig, Admin } from './types';
import { LayoutDashboard, FileText, Drill, Menu, X, Lock, KeyRound, ShieldCheck, LogOut, AlertTriangle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { RIGS as INITIAL_RIGS, EMPLOYEES as INITIAL_EMPLOYEES, MATERIALS as INITIAL_MATERIALS, ADMINS as INITIAL_ADMINS, INITIAL_ROLES } from './constants';
import { pushToCloud, pullFromCloud } from './services/syncService';

type ViewState = 'form' | 'dashboard' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync State
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('sondalog_sync_id') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Database State
  const [rigs, setRigs] = useState<Rig[]>(() => JSON.parse(localStorage.getItem('sondalog_rigs') || JSON.stringify(INITIAL_RIGS)));
  const [employees, setEmployees] = useState<Employee[]>(() => JSON.parse(localStorage.getItem('sondalog_employees') || JSON.stringify(INITIAL_EMPLOYEES)));
  const [materials, setMaterials] = useState<Material[]>(() => JSON.parse(localStorage.getItem('sondalog_materials') || JSON.stringify(INITIAL_MATERIALS)));
  const [admins, setAdmins] = useState<Admin[]>(() => JSON.parse(localStorage.getItem('sondalog_admins') || JSON.stringify(INITIAL_ADMINS)));
  const [roles, setRoles] = useState<string[]>(() => JSON.parse(localStorage.getItem('sondalog_roles') || JSON.stringify(INITIAL_ROLES)));
  const [requests, setRequests] = useState<MaterialRequest[]>(() => JSON.parse(localStorage.getItem('sondalog_requests') || '[]'));

  // Auth State
  const [authenticatedSupervisorId, setAuthenticatedSupervisorId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetViewForLogin, setTargetViewForLogin] = useState<ViewState>('form'); 
  const [loginUser, setLoginUser] = useState(''); 
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Persistence Effects (Local)
  useEffect(() => {
    localStorage.setItem('sondalog_rigs', JSON.stringify(rigs));
    localStorage.setItem('sondalog_employees', JSON.stringify(employees));
    localStorage.setItem('sondalog_materials', JSON.stringify(materials));
    localStorage.setItem('sondalog_admins', JSON.stringify(admins));
    localStorage.setItem('sondalog_roles', JSON.stringify(roles));
    localStorage.setItem('sondalog_requests', JSON.stringify(requests));
    localStorage.setItem('sondalog_sync_id', syncId);
  }, [rigs, employees, materials, admins, roles, requests, syncId]);

  // Cloud Sync Handler
  const performCloudSync = useCallback(async (isPush: boolean = true) => {
    if (!syncId) return;
    setIsSyncing(true);
    
    if (isPush) {
      const dataToPush = { rigs, employees, materials, admins, roles, requests };
      await pushToCloud(syncId, dataToPush);
    } else {
      const remoteData = await pullFromCloud(syncId);
      if (remoteData) {
        if (remoteData.rigs) setRigs(remoteData.rigs);
        if (remoteData.employees) setEmployees(remoteData.employees);
        if (remoteData.materials) setMaterials(remoteData.materials);
        if (remoteData.admins) setAdmins(remoteData.admins);
        if (remoteData.roles) setRoles(remoteData.roles);
        if (remoteData.requests) setRequests(remoteData.requests);
      }
    }
    
    setLastSync(new Date());
    setIsSyncing(false);
  }, [syncId, rigs, employees, materials, admins, roles, requests]);

  // Initial Pull and Polling
  useEffect(() => {
    if (syncId) {
      performCloudSync(false); // Initial pull
      const interval = setInterval(() => {
        performCloudSync(false); // Periodically pull updates (Multi-device comms)
      }, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [syncId]);

  // --- Handlers wrapping sync ---
  const handleUpdateStatus = async (id: string, status: RequestStatus) => {
    const updated = requests.map(req => req.id === id ? { ...req, status } : req);
    setRequests(updated);
    if (syncId) await pushToCloud(syncId, { rigs, employees, materials, admins, roles, requests: updated });
  };

  const handleUpdateItems = async (id: string, items: RequestItem[]) => {
    const updated = requests.map(req => req.id === id ? { ...req, items } : req);
    setRequests(updated);
    if (syncId) await pushToCloud(syncId, { rigs, employees, materials, admins, roles, requests: updated });
  };

  const handleCreateRequest = async (rigId: string, employeeId: string, supervisorId: string, items: RequestItem[]) => {
    const newRequest: MaterialRequest = {
      id: Math.random().toString(36).substr(2, 9),
      rigId, employeeId, supervisorId, items,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    const newRequests = [newRequest, ...requests];
    setRequests(newRequests);
    if (syncId) await pushToCloud(syncId, { rigs, employees, materials, admins, roles, requests: newRequests });
    alert(`Solicitação enviada para análise!`);
  };

  const handleImportDatabase = (data: any) => {
    if (data.materials) setMaterials(data.materials);
    if (data.employees) setEmployees(data.employees);
    if (data.rigs) setRigs(data.rigs);
    if (data.admins) setAdmins(data.admins);
    if (data.roles) setRoles(data.roles);
    if (data.requests) setRequests(data.requests);
    alert('Base de dados atualizada!');
  };

  // Auth & Nav
  const handleLogout = () => { setAuthenticatedSupervisorId(null); setCurrentAdmin(null); setCurrentView('form'); };
  const handleProtectedNavigation = (target: ViewState) => {
    if (target === 'dashboard') {
      if (authenticatedSupervisorId) setCurrentView('dashboard');
      else { setTargetViewForLogin('dashboard'); setShowLoginModal(true); }
    } else if (target === 'admin') {
      if (currentAdmin) setCurrentView('admin');
      else { setTargetViewForLogin('admin'); setShowLoginModal(true); }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetViewForLogin === 'dashboard') {
      const supervisor = employees.find(e => e.id === loginUser && e.role === 'Supervisor');
      if (supervisor && supervisor.password && passwordInput === supervisor.password) {
        setAuthenticatedSupervisorId(loginUser); setCurrentView('dashboard'); setShowLoginModal(false);
      } else setLoginError(true);
    } else if (targetViewForLogin === 'admin') {
      const admin = admins.find(a => a.id === loginUser);
      if (admin && admin.password === passwordInput) {
        setCurrentAdmin(admin); setCurrentView('admin'); setShowLoginModal(false);
      } else setLoginError(true);
    }
  };

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
            {/* Sync Indicator */}
            {syncId && (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 mr-4">
                {isSyncing ? <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" /> : <Cloud className="w-3 h-3 text-green-400" />}
                <span className="text-[10px] text-slate-300 font-mono">{syncId}</span>
              </div>
            )}
            
            <button onClick={() => { setCurrentView('form'); setAuthenticatedSupervisorId(null); }} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'form' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Solicitar</button>
            <button onClick={() => handleProtectedNavigation('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Supervisor</button>
            <button onClick={() => handleProtectedNavigation('admin')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Admin</button>
            {(authenticatedSupervisorId || currentAdmin) && <button onClick={handleLogout} className="p-2 text-red-300 hover:bg-red-900/30 rounded-md"><LogOut className="w-4 h-4" /></button>}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {currentView === 'form' && <RequestForm onSubmit={handleCreateRequest} rigs={rigs} employees={employees} materials={materials} />}
        {currentView === 'dashboard' && authenticatedSupervisorId && <SupervisorDashboard requests={requests.filter(req => req.supervisorId === authenticatedSupervisorId)} onUpdateStatus={handleUpdateStatus} onUpdateItems={handleUpdateItems} onDeleteRequest={(id) => setRequests(requests.filter(r => r.id !== id))} rigs={rigs} employees={employees} onChangePassword={(p) => setEmployees(employees.map(e => e.id === authenticatedSupervisorId ? {...e, password: p} : e))} />}
        {currentView === 'admin' && currentAdmin && <AdminDashboard currentAdmin={currentAdmin} materials={materials} employees={employees} rigs={rigs} admins={admins} roles={roles} requests={requests} onAddMaterial={(m) => setMaterials([...materials, m])} onUpdateMaterial={(s, m) => setMaterials(materials.map(x => x.sku === s ? m : x))} onDeleteMaterial={(s) => setMaterials(materials.filter(m => m.sku !== s))} onAddEmployee={(e) => setEmployees([...employees, e])} onUpdateEmployee={(id, e) => setEmployees(employees.map(x => x.id === id ? e : x))} onDeleteEmployee={(id) => setEmployees(employees.filter(e => e.id !== id))} onAddRig={(r) => setRigs([...rigs, r])} onUpdateRig={(id, r) => setRigs(rigs.map(x => x.id === id ? r : x))} onDeleteRig={(id) => setRigs(rigs.filter(r => r.id !== id))} onAddAdmin={(a) => setAdmins([...admins, a])} onUpdateAdmin={(id, a) => { setAdmins(admins.map(x => x.id === id ? a : x)); return true; }} onDeleteAdmin={(id) => setAdmins(admins.filter(a => a.id !== id))} onAddRole={(r) => setRoles([...roles, r])} onDeleteRole={(r) => setRoles(roles.filter(x => x !== r))} onImportDatabase={handleImportDatabase} />}
        
        {/* Admin Cloud Sync Tab Integration happens inside AdminDashboard if view is admin */}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 text-center mb-6">{targetViewForLogin === 'admin' ? 'Acesso Administrativo' : 'Login de Supervisor'}</h3>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {targetViewForLogin === 'dashboard' ? (
                <select className="w-full px-3 py-2 border rounded-lg" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} required>
                  <option value="">Selecione seu usuário...</option>
                  {employees.filter(e => e.role === 'Supervisor').map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                </select>
              ) : (
                <input type="text" className="w-full px-4 py-2 border rounded-lg" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Usuário Admin" required />
              )}
              <input type="password" placeholder="Senha" className={`w-full px-4 py-2 border rounded-lg ${loginError ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud Sync Settings - Embedded in Admin View via a hidden trick or updated AdminDashboard */}
      {currentView === 'admin' && currentAdmin?.role === 'MASTER' && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Cloud className="w-5 h-5 text-blue-500" />
                    Sincronização em Nuvem (Multi-Dispositivo)
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">ID do Grupo / Chave da Empresa</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-slate-300 rounded-md font-mono"
                            placeholder="Ex: RECV-SONDAS-2024"
                            value={syncId}
                            onChange={(e) => setSyncId(e.target.value.toUpperCase().replace(/\s/g, '-'))}
                        />
                    </div>
                    <button 
                        onClick={() => performCloudSync(true)}
                        disabled={!syncId || isSyncing}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Forçar Envio para Nuvem
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                    * Todos os dispositivos usando a mesma chave compartilharão a mesma lista de solicitações e materiais em tempo real.
                </p>
            </div>
        </div>
      )}

      <footer className="bg-white border-t p-6 text-center text-sm text-slate-400">© 2024 SondaLog Oil & Gas RECV.</footer>
    </div>
  );
};

export default App;
