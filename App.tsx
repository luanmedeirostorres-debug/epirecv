import React, { useState } from 'react';
import { RequestForm } from './components/RequestForm';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MaterialRequest, RequestItem, RequestStatus, Material, Employee, Rig, Admin } from './types';
import { LayoutDashboard, FileText, Drill, Menu, X, Lock, KeyRound, ShieldCheck, LogOut } from 'lucide-react';
import { RIGS as INITIAL_RIGS, EMPLOYEES as INITIAL_EMPLOYEES, MATERIALS as INITIAL_MATERIALS, ADMINS as INITIAL_ADMINS } from './constants';

type ViewState = 'form' | 'dashboard' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database State (Lifted from constants)
  const [rigs, setRigs] = useState<Rig[]>(INITIAL_RIGS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);

  // Auth State
  const [authenticatedSupervisorId, setAuthenticatedSupervisorId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetViewForLogin, setTargetViewForLogin] = useState<ViewState>('form'); 
  
  // Login Form State
  const [loginUser, setLoginUser] = useState(''); // Used for Supervisor (Select) AND Admin (Input)
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Database Management Functions
  const handleAddMaterial = (material: Material) => {
    setMaterials([...materials, material]);
  };

  const handleAddEmployee = (employee: Employee) => {
    setEmployees([...employees, employee]);
  };

  const handleAddRig = (rig: Rig) => {
    setRigs([...rigs, rig]);
  };

  const handleAddAdmin = (admin: Admin) => {
    setAdmins([...admins, admin]);
  }

  // Update existing admin (for "My Account" feature)
  const handleUpdateAdmin = (originalId: string, updatedAdmin: Admin) => {
    // Check if ID is being changed and if it conflicts with another existing admin (excluding self)
    if (originalId !== updatedAdmin.id && admins.some(a => a.id === updatedAdmin.id)) {
      alert("Este ID de login já está em uso por outro administrador.");
      return false;
    }

    setAdmins(prevAdmins => prevAdmins.map(admin => 
      admin.id === originalId ? updatedAdmin : admin
    ));

    // If the currently logged-in admin updated themselves, update the session
    if (currentAdmin && currentAdmin.id === originalId) {
      setCurrentAdmin(updatedAdmin);
    }
    
    return true;
  };

  // Request Management Functions
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
    alert(`Solicitação enviada com sucesso para análise do supervisor ${supervisor?.name || supervisorId}!`);
  };

  const handleUpdateStatus = (id: string, status: RequestStatus) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  // Logic to update the specific supervisor's password
  const handleSupervisorPasswordChange = (newPassword: string) => {
    if (!authenticatedSupervisorId) return;

    setEmployees(employees.map(emp => {
        if (emp.id === authenticatedSupervisorId) {
            return { ...emp, password: newPassword };
        }
        return emp;
    }));
  };

  // Navigation & Auth Handling
  const handleProtectedNavigation = (target: ViewState) => {
    if (target === 'dashboard') {
      if (authenticatedSupervisorId) {
        setCurrentView('dashboard');
      } else {
        setTargetViewForLogin('dashboard');
        setShowLoginModal(true);
        setLoginError(false);
        setLoginUser('');
        setPasswordInput('');
      }
    } else if (target === 'admin') {
      if (currentAdmin) {
        setCurrentView('admin');
      } else {
        setTargetViewForLogin('admin');
        setShowLoginModal(true);
        setLoginError(false);
        setLoginUser('');
        setPasswordInput('');
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (currentView === 'dashboard') {
      setAuthenticatedSupervisorId(null);
      setCurrentView('form');
    } else if (currentView === 'admin') {
      setCurrentAdmin(null);
      setCurrentView('form');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);

    if (targetViewForLogin === 'dashboard') {
      // Supervisor Login
      const supervisor = employees.find(e => e.id === loginUser && e.role === 'Supervisor');
      
      if (supervisor && supervisor.password && passwordInput === supervisor.password) {
        setAuthenticatedSupervisorId(loginUser);
        setCurrentView('dashboard');
        setShowLoginModal(false);
      } else {
        setLoginError(true);
      }
    } else if (targetViewForLogin === 'admin') {
      // Admin Login (Supports Multiple Admins)
      const admin = admins.find(a => a.id === loginUser);

      if (admin && admin.password === passwordInput) {
        setCurrentAdmin(admin);
        setCurrentView('admin');
        setShowLoginModal(false);
      } else {
        setLoginError(true);
      }
    }
  };

  const getLoginTitle = () => {
    return targetViewForLogin === 'admin' ? 'Acesso Administrativo' : 'Login de Supervisor';
  };
  
  const supervisors = employees.filter(e => e.role === 'Supervisor');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Drill className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">SondaLog</span>
                <span className="text-xs text-slate-400 block -mt-1 font-medium">Gestão de Materiais</span>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('form')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'form' 
                    ? 'bg-slate-800 text-white shadow-inner' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Nova Solicitação
              </button>
              
              <button
                onClick={() => handleProtectedNavigation('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'dashboard' 
                    ? 'bg-slate-800 text-white shadow-inner' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {authenticatedSupervisorId ? <LayoutDashboard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Painel do Supervisor
                {authenticatedSupervisorId && requests.filter(r => r.status === RequestStatus.PENDING && r.supervisorId === authenticatedSupervisorId).length > 0 && (
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                    {requests.filter(r => r.status === RequestStatus.PENDING && r.supervisorId === authenticatedSupervisorId).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleProtectedNavigation('admin')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'admin' 
                    ? 'bg-slate-800 text-white shadow-inner' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {currentAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Admin
              </button>
              
              {/* Logout Button (Visible only when authenticated in a protected view) */}
              {((currentView === 'dashboard' && authenticatedSupervisorId) || (currentView === 'admin' && currentAdmin)) && (
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-100 transition-colors flex items-center gap-2"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => { setCurrentView('form'); setIsMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === 'form' ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Nova Solicitação
              </button>
              <button
                onClick={() => handleProtectedNavigation('dashboard')}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                   {authenticatedSupervisorId ? null : <Lock className="w-4 h-4" />}
                   Painel do Supervisor
                </span>
              </button>
              <button
                onClick={() => handleProtectedNavigation('admin')}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                   {currentAdmin ? null : <Lock className="w-4 h-4" />}
                   Painel Admin
                </span>
              </button>
              {((currentView === 'dashboard' && authenticatedSupervisorId) || (currentView === 'admin' && currentAdmin)) && (
                <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-700 hover:text-red-300"
                >
                    <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sair
                    </span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold text-slate-900">Solicitação de Material</h1>
              <p className="mt-2 text-slate-600">Preencha os dados abaixo para requisitar materiais para a sonda.</p>
            </div>
            <RequestForm 
              onSubmit={handleCreateRequest} 
              rigs={rigs} 
              employees={employees} 
              materials={materials} 
            />
          </div>
        )}
        
        {currentView === 'dashboard' && authenticatedSupervisorId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900">Controle de Solicitações</h1>
                  <p className="mt-2 text-slate-600">
                      Olá, <span className="font-semibold text-blue-700">{employees.find(e => e.id === authenticatedSupervisorId)?.name}</span>. 
                      Gerencie suas requisições pendentes abaixo.
                  </p>
              </div>
            </div>
            <SupervisorDashboard 
              requests={requests.filter(req => req.supervisorId === authenticatedSupervisorId)} 
              onUpdateStatus={handleUpdateStatus} 
              rigs={rigs} 
              employees={employees} 
              onChangePassword={handleSupervisorPasswordChange}
            />
          </div>
        )}

        {currentView === 'admin' && currentAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <h1 className="text-3xl font-bold text-slate-900">Administração</h1>
                 <span className={`px-2 py-1 rounded-full text-xs font-bold border ${currentAdmin.role === 'MASTER' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    {currentAdmin.role === 'MASTER' ? 'MASTER ADMIN' : 'ADMINISTRADOR'}
                 </span>
              </div>
              <p className="mt-2 text-slate-600">
                  Logado como: <b>{currentAdmin.name}</b>. 
                  {currentAdmin.role === 'COMMON' 
                    ? ' Acesso restrito a Materiais e Colaboradores.' 
                    : ' Acesso total ao sistema.'}
              </p>
            </div>
            <AdminDashboard 
              currentAdmin={currentAdmin}
              onAddMaterial={handleAddMaterial}
              onAddEmployee={handleAddEmployee}
              onAddRig={handleAddRig}
              onAddAdmin={handleAddAdmin}
              onUpdateAdmin={handleUpdateAdmin}
            />
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{getLoginTitle()}</h3>
              <p className="text-sm text-slate-500 mt-1">
                  {targetViewForLogin === 'dashboard' ? 'Selecione seu usuário e digite a senha.' : 'Digite a senha para continuar.'}
              </p>
              
              <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-100 py-1 rounded">
                {targetViewForLogin === 'admin' ? 
                   <><strong>Master:</strong> admin / master123 <br/> <strong>Comum:</strong> almoxarife / user123</> : 
                   <>Senha pessoal (padrão inicial: <strong>prrecv</strong>)</>
                }
              </p>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              {/* Supervisor Selection Field - Only for Dashboard Login */}
              {targetViewForLogin === 'dashboard' && (
                  <div className="mb-4 text-left">
                    <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Usuário</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={loginUser}
                        onChange={(e) => {
                            setLoginUser(e.target.value);
                            setLoginError(false);
                        }}
                        required
                    >
                        <option value="">Selecione o Supervisor...</option>
                        {supervisors.map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                    </select>
                  </div>
              )}

               {/* Admin Login: Text Input for ID/Username */}
               {targetViewForLogin === 'admin' && (
                  <div className="mb-4 text-left">
                    <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Usuário / ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={loginUser}
                      onChange={(e) => {
                        setLoginUser(e.target.value);
                        setLoginError(false);
                      }}
                      autoFocus
                      placeholder="Ex: admin"
                      required
                    />
                  </div>
              )}

              <div className="mb-6 text-left">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Senha</label>
                <input
                  type="password"
                  placeholder="******"
                  className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 transition-all ${
                    loginError 
                      ? 'border-red-300 focus:ring-red-200 bg-red-50 text-red-900 placeholder-red-400' 
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500 bg-white'
                  }`}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError(false);
                  }}
                />
                {loginError && (
                  <p className="text-xs text-red-500 mt-1 font-medium ml-1">
                      {targetViewForLogin === 'dashboard' ? 'Usuário ou senha incorretos.' : 'Credenciais inválidas.'}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                  disabled={(targetViewForLogin === 'dashboard' && !loginUser) || !passwordInput}
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            © 2024 SondaLog Oil & Gas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;