
import React, { useState, useEffect, useCallback } from 'react';
import { RequestForm } from './components/RequestForm';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MaterialRequest, RequestItem, RequestStatus, Material, Employee, Rig, Admin } from './types';
import { Drill, LogOut, Cloud, RefreshCw, KeyRound, User, Lock } from 'lucide-react';
import { RIGS as INITIAL_RIGS, EMPLOYEES as INITIAL_EMPLOYEES, MATERIALS as INITIAL_MATERIALS, ADMINS as INITIAL_ADMINS, INITIAL_ROLES } from './constants';
import { pushToCloud, pullFromCloud } from './services/syncService';

type ViewState = 'form' | 'dashboard' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('form');

  // Sync State - Default to SONDAS-PR as requested
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('sondalog_sync_id') || 'SONDAS-PR');
  const [isSyncing, setIsSyncing] = useState(false);

  // Database State
  const [rigs, setRigs] = useState<Rig[]>(() => JSON.parse(localStorage.getItem('sondalog_rigs') || JSON.stringify(INITIAL_RIGS)));
  const [employees, setEmployees] = useState<Employee[]>(() => JSON.parse(localStorage.getItem('sondalog_employees') || JSON.stringify(INITIAL_EMPLOYEES)));
  const [materials, setMaterials] = useState<Material[]>(() => JSON.parse(localStorage.getItem('sondalog_materials') || JSON.stringify(INITIAL_MATERIALS)));
  const [admins, setAdmins] = useState<Admin[]>(() => JSON.parse(localStorage.getItem('sondalog_admins') || JSON.stringify(INITIAL_ADMINS)));
  const [roles, setRoles] = useState<string[]>(() => JSON.parse(localStorage.getItem('sondalog_roles') || JSON.stringify(INITIAL_ROLES)));
  const [requests, setRequests] = useState<MaterialRequest[]>(() => JSON.parse(localStorage.getItem('sondalog_requests') || '[]'));

  // Auth States
  const [authenticatedSolicitor, setAuthenticatedSolicitor] = useState<Employee | null>(null);
  const [authenticatedSupervisorId, setAuthenticatedSupervisorId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  // Login Form States
  const [loginUser, setLoginUser] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Security Effect: Logout when leaving a protected tab
  useEffect(() => {
    // When switching views, we clear the authentication of the tabs that are not currently active
    // This ensures "ask for authentication again" when returning.
    if (currentView !== 'dashboard') {
      setAuthenticatedSupervisorId(null);
    }
    if (currentView !== 'admin') {
      setCurrentAdmin(null);
    }
    if (currentView !== 'form') {
      setAuthenticatedSolicitor(null);
    }

    // Always clear the form inputs when moving between tabs for security
    setLoginUser('');
    setPasswordInput('');
    setLoginError(false);
  }, [currentView]);

  // Persistence Effects
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
    try {
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
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [syncId, rigs, employees, materials, admins, roles, requests]);

  // Initial pull and polling
  useEffect(() => {
    if (syncId) {
      performCloudSync(false);
      const interval = setInterval(() => performCloudSync(false), 30000);
      return () => clearInterval(interval);
    }
  }, [syncId, performCloudSync]);

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
    alert(`Solicitação enviada com sucesso!`);
  };

  const handleUpdateStatus = useCallback(async (id: string, status: RequestStatus) => {
    const updatedRequests = requests.map(req => req.id === id ? { ...req, status } : req);
    setRequests(updatedRequests);
    if (syncId) await pushToCloud(syncId, { rigs, employees, materials, admins, roles, requests: updatedRequests });
  }, [requests, syncId, rigs, employees, materials, admins, roles]);

  const handleUpdateItems = useCallback(async (id: string, items: RequestItem[]) => {
    const updatedRequests = requests.map(req => req.id === id ? { ...req, items } : req);
    setRequests(updatedRequests);
    if (syncId) await pushToCloud(syncId, { rigs, employees, materials, admins, roles, requests: updatedRequests });
  }, [requests, syncId, rigs, employees, materials, admins, roles]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);

    if (currentView === 'form') {
      const emp = employees.find(e => e.id === loginUser);
      const validPass = emp?.password || 'sondas';
      if (emp && passwordInput === validPass) {
        setAuthenticatedSolicitor(emp);
        setLoginUser('');
        setPasswordInput('');
      } else {
        setLoginError(true);
      }
    } else if (currentView === 'dashboard') {
      // Requisito: Acesso por NOME para o Supervisor
      const supervisor = employees.find(e => e.name.toLowerCase() === loginUser.toLowerCase() && e.role === 'Supervisor');
      const validPass = supervisor?.password || 'prrecv'; 
      if (supervisor && passwordInput === validPass) {
        setAuthenticatedSupervisorId(supervisor.id);
        setLoginUser('');
        setPasswordInput('');
      } else setLoginError(true);
    } else if (currentView === 'admin') {
      const admin = admins.find(a => a.id === loginUser);
      if (admin && admin.password === passwordInput) {
        setCurrentAdmin(admin);
        setLoginUser('');
        setPasswordInput('');
      } else setLoginError(true);
    }
  };

  const handleLogout = () => {
    setAuthenticatedSolicitor(null);
    setAuthenticatedSupervisorId(null);
    setCurrentAdmin(null);
    setCurrentView('form');
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

  // Login is required for dashboard and admin
  const needsLogin = (currentView === 'dashboard' && !authenticatedSupervisorId) || 
                   (currentView === 'admin' && !currentAdmin);

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
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={() => setCurrentView('form')} className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${currentView === 'form' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Solicitar</button>
            <button onClick={() => setCurrentView('dashboard')} className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Supervisor</button>
            <button onClick={() => setCurrentView('admin')} className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>Admin</button>
            {(authenticatedSolicitor || authenticatedSupervisorId || currentAdmin) && (
              <button onClick={handleLogout} className="p-2 text-red-300 hover:bg-red-900/30 rounded-md ml-1" title="Sair">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {needsLogin ? (
          <div className="max-w-md mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <KeyRound className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {currentView === 'dashboard' ? 'Acesso ao Supervisor' : 'Acesso ao Administrador'}
                </h1>
                <p className="text-slate-500 text-sm mt-2">
                  {currentView === 'dashboard' ? 'Digite seu Nome Completo e Senha' : 'Identifique-se com sua matrícula e senha'}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                    {currentView === 'dashboard' ? 'Nome do Supervisor' : 'Usuário / Matrícula'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                      value={loginUser} 
                      onChange={(e) => setLoginUser(e.target.value)} 
                      placeholder={currentView === 'dashboard' ? "Ex: Carlos Oliveira" : "Ex: MAT001"} 
                      required 
                    />
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Senha</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                      value={passwordInput} 
                      onChange={(e) => setPasswordInput(e.target.value)} 
                      placeholder="••••••••" 
                      required 
                    />
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium text-center">
                    Credenciais inválidas. Verifique os dados.
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
                  Entrar no Sistema
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'form' && (
              <RequestForm 
                onSubmit={handleCreateRequest} 
                rigs={rigs} 
                employees={employees} 
                materials={materials}
                currentUser={authenticatedSolicitor || undefined}
                syncId={syncId}
                onPerformSync={performCloudSync}
                isSyncing={isSyncing}
              />
            )}
            {currentView === 'dashboard' && authenticatedSupervisorId && (
              <SupervisorDashboard 
                requests={requests.filter(req => req.supervisorId === authenticatedSupervisorId)} 
                onUpdateStatus={handleUpdateStatus} 
                onUpdateItems={handleUpdateItems} 
                onDeleteRequest={(id) => setRequests(requests.filter(r => r.id !== id))} 
                rigs={rigs} 
                employees={employees} 
                onChangePassword={(p) => setEmployees(employees.map(e => e.id === authenticatedSupervisorId ? {...e, password: p} : e))}
                syncId={syncId}
                onSyncIdChange={setSyncId}
                onPerformSync={performCloudSync}
                isSyncing={isSyncing}
              />
            )}
            {currentView === 'admin' && currentAdmin && (
              <AdminDashboard 
                currentAdmin={currentAdmin} 
                materials={materials} 
                employees={employees} 
                rigs={rigs} 
                admins={admins} 
                roles={roles} 
                requests={requests} 
                onAddMaterial={(m) => setMaterials([...materials, m])} 
                onUpdateMaterial={(s, m) => setMaterials(materials.map(x => x.sku === s ? m : x))} 
                onDeleteMaterial={(s) => setMaterials(materials.filter(m => m.sku !== s))} 
                onAddEmployee={(e) => setEmployees([...employees, e])} 
                onUpdateEmployee={(id, e) => setEmployees(employees.map(x => x.id === id ? e : x))} 
                onDeleteEmployee={(id) => setEmployees(employees.filter(e => e.id !== id))} 
                onAddRig={(r) => setRigs([...rigs, r])} 
                onUpdateRig={(id, r) => setRigs(rigs.map(x => x.id === id ? r : x))} 
                onDeleteRig={(id) => setRigs(rigs.filter(r => r.id !== id))} 
                onAddAdmin={(a) => setAdmins([...admins, a])} 
                onUpdateAdmin={(id, a) => { setAdmins(admins.map(x => x.id === id ? a : x)); return true; }} 
                onDeleteAdmin={(id) => setAdmins(admins.filter(a => a.id !== id))} 
                onAddRole={(r) => setRoles([...roles, r])} 
                onDeleteRole={(r) => setRoles(roles.filter(x => x !== r))} 
                onImportDatabase={handleImportDatabase}
                syncId={syncId}
                onSyncIdChange={setSyncId}
                onPerformSync={performCloudSync}
                isSyncing={isSyncing}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t p-6 text-center text-sm text-slate-400">© 2024 SondaLog Oil & Gas RECV.</footer>
    </div>
  );
};

export default App;
