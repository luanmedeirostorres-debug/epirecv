import React, { useState } from 'react';
import { MaterialRequest, RequestStatus, Rig, Employee } from '../types';
import { CheckCircle2, XCircle, Clock, AlertCircle, FileSpreadsheet, Inbox, Settings, X, Lock } from 'lucide-react';

interface SupervisorDashboardProps {
  requests: MaterialRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  rigs: Rig[];
  employees: Employee[];
  onChangePassword: (newPassword: string) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ requests, onUpdateStatus, rigs, employees, onChangePassword }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Selection State for Export
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());

  const getRigName = (id: string) => rigs.find(r => r.id === id)?.name || id;
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING);
  const historyRequests = requests.filter(r => r.status !== RequestStatus.PENDING);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedRequestIds);
    if (newSelection.has(id)) {
        newSelection.delete(id);
    } else {
        newSelection.add(id);
    }
    setSelectedRequestIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedRequestIds.size === historyRequests.length) {
        setSelectedRequestIds(new Set());
    } else {
        setSelectedRequestIds(new Set(historyRequests.map(r => r.id)));
    }
  };

  const handleExportCSV = () => {
    // Filter requests that are SELECTED and match the criteria (usually just history requests, but we verify they are in the list)
    const requestsToExport = historyRequests.filter(r => 
        selectedRequestIds.has(r.id) && r.status === RequestStatus.APPROVED
    );

    if (requestsToExport.length === 0) {
      alert("Selecione pelo menos uma solicitação aprovada na lista de histórico para exportar.");
      return;
    }

    // Cabeçalhos em CAIXA ALTA conforme solicitado para clareza na exportação
    const headers = [
      "SKU",
      "DESCRIÇÃO",
      "SONDA",
      "COLABORADOR",
      "MATRÍCULA",
      "QUANTIDADE",
      "UNIDADE"
    ];

    const csvRows = [headers.join(",")];

    requestsToExport.forEach(req => {
      const rigName = getRigName(req.rigId).replace(/"/g, '""');
      const empName = getEmployeeName(req.employeeId).replace(/"/g, '""');

      req.items.forEach(item => {
        const row = [
          item.material.sku,
          `"${item.material.description.replace(/"/g, '""')}"`,
          `"${rigName}"`,
          `"${empName}"`,
          req.employeeId, // Matrícula em coluna separada
          item.quantity,
          item.material.unit
        ];
        csvRows.push(row.join(","));
      });
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sondalog_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPasswordError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }

    onChangePassword(newPassword);
    alert('Senha alterada com sucesso!');
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return (
    <div className="space-y-8">
      
      {/* Top Controls */}
      <div className="flex justify-end gap-2">
         <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95 transform"
          >
            <Settings className="w-4 h-4" />
            Alterar Senha
          </button>
      </div>

      {/* Pending Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Aguardando Sua Análise
        </h2>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
            Todas as solicitações atribuídas a você foram analisadas. Bom trabalho!
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">{getRigName(req.rigId)}</h3>
                    <p className="text-sm text-slate-500">
                      Solicitante: <span className="text-slate-700 font-medium">{getEmployeeName(req.employeeId)}</span> 
                      <span className="text-slate-400 mx-2">|</span>
                      Mat: <span className="text-slate-700 font-mono">{req.employeeId}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStatus(req.id, RequestStatus.REJECTED)}
                      className="flex items-center gap-1 px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Negar
                    </button>
                    <button
                      onClick={() => onUpdateStatus(req.id, RequestStatus.APPROVED)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprovar
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="text-left py-2 font-medium">SKU</th>
                        <th className="text-left py-2 font-medium">Descrição</th>
                        <th className="text-right py-2 font-medium">Qtd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {req.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 text-slate-600 font-mono">{item.material.sku}</td>
                          <td className="py-2 text-slate-800">{item.material.description}</td>
                          <td className="py-2 text-right font-medium text-slate-800">{item.quantity} {item.material.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Seu Histórico Recente
          </h2>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95 transform"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Selecionados (CSV)
          </button>
        </div>
        
        {requests.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={historyRequests.length > 0 && selectedRequestIds.size === historyRequests.length}
                        onChange={toggleAllSelection}
                      />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sonda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Matrícula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Itens</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 text-sm">
                {historyRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedRequestIds.has(req.id)}
                            onChange={() => toggleSelection(req.id)}
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{getRigName(req.rigId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500">{req.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{getEmployeeName(req.employeeId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{req.items.length} itens</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        req.status === RequestStatus.APPROVED 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {req.status === RequestStatus.APPROVED ? 'Aprovado' : 'Negado'}
                      </span>
                    </td>
                  </tr>
                ))}
                {historyRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-slate-400 text-sm">Nenhum histórico disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
           <div className="bg-white p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                  <h3 className="text-lg font-medium text-slate-900">Nenhuma solicitação encontrada</h3>
                  <p className="text-slate-500 mt-1">Você não possui solicitações pendentes ou histórico recente.</p>
              </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Alterar Senha de Acesso</h3>
              <p className="text-sm text-slate-500 mt-1">Defina uma nova senha para o acesso de supervisor.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Nova Senha</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Nova senha..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Confirmar Senha</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Confirme a senha..."
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-500 font-medium ml-1">{passwordError}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};