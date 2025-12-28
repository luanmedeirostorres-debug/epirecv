import React, { useState } from 'react';
import { MaterialRequest, RequestStatus, Rig, Employee, RequestItem } from '../types';
import { CheckCircle2, XCircle, Clock, AlertCircle, FileSpreadsheet, Inbox, Settings, X, Lock, AlertTriangle, Trash2, Undo2, Pencil, Save, CheckSquare, Square } from 'lucide-react';

interface SupervisorDashboardProps {
  requests: MaterialRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onUpdateItems: (id: string, items: RequestItem[]) => void;
  onDeleteRequest: (id: string) => void;
  rigs: Rig[];
  employees: Employee[];
  onChangePassword: (newPassword: string) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ 
  requests, onUpdateStatus, onUpdateItems, onDeleteRequest, rigs, employees, onChangePassword 
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);
  
  // Tabs for History/Trash
  const [activeHistoryTab, setActiveHistoryTab] = useState<'approved' | 'rejected'>('approved');

  // Selection States
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());

  // Editing State for Items
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [tempItems, setTempItems] = useState<RequestItem[]>([]);

  const getRigName = (id: string) => rigs.find(r => r.id === id)?.name || id;
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING);
  const approvedRequests = requests.filter(r => r.status === RequestStatus.APPROVED);
  const rejectedRequests = requests.filter(r => r.status === RequestStatus.REJECTED);
  
  const currentHistoryList = activeHistoryTab === 'approved' ? approvedRequests : rejectedRequests;

  // --- SELECTION HANDLERS ---
  const togglePendingSelection = (id: string) => {
    const next = new Set(selectedPendingIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedPendingIds(next);
  };

  const toggleAllPending = () => {
    if (selectedPendingIds.size === pendingRequests.length) {
      setSelectedPendingIds(new Set());
    } else {
      setSelectedPendingIds(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const toggleHistorySelection = (id: string) => {
    const next = new Set(selectedHistoryIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedHistoryIds(next);
  };

  const toggleAllHistory = () => {
    if (selectedHistoryIds.size === currentHistoryList.length) {
      setSelectedHistoryIds(new Set());
    } else {
      setSelectedHistoryIds(new Set(currentHistoryList.map(r => r.id)));
    }
  };

  // --- BULK ACTIONS ---
  const handleBulkApprove = () => {
    if (confirm(`Aprovar ${selectedPendingIds.size} solicitações selecionadas?`)) {
      selectedPendingIds.forEach(id => onUpdateStatus(id, RequestStatus.APPROVED));
      setSelectedPendingIds(new Set());
    }
  };

  const handleBulkReject = () => {
    if (confirm(`Negar ${selectedPendingIds.size} solicitações selecionadas?`)) {
      selectedPendingIds.forEach(id => onUpdateStatus(id, RequestStatus.REJECTED));
      setSelectedPendingIds(new Set());
    }
  };

  // --- ITEM EDITING ---
  const startEditing = (req: MaterialRequest) => {
    setEditingRequestId(req.id);
    setTempItems(JSON.parse(JSON.stringify(req.items))); // Deep clone
  };

  const cancelEditing = () => {
    setEditingRequestId(null);
    setTempItems([]);
  };

  const handleTempQtyChange = (idx: number, val: string) => {
    const newItems = [...tempItems];
    newItems[idx].quantity = Math.max(0, parseInt(val) || 0);
    setTempItems(newItems);
  };

  const saveItemChanges = (id: string) => {
    onUpdateItems(id, tempItems);
    setEditingRequestId(null);
    setTempItems([]);
    alert("Quantidades atualizadas com sucesso!");
  };

  // --- EXPORT ---
  const handleExportCSV = () => {
    const requestsToExport = currentHistoryList.filter(r => selectedHistoryIds.has(r.id));
    if (requestsToExport.length === 0) {
      alert("Selecione solicitações na lista para exportar.");
      return;
    }

    const headers = ["SKU", "DESCRIÇÃO", "SONDA", "COLABORADOR", "MATRÍCULA", "QUANTIDADE", "UNIDADE", "STATUS"];
    const csvRows = [headers.join(",")];

    requestsToExport.forEach(req => {
      const rigName = getRigName(req.rigId).replace(/"/g, '""');
      const empName = getEmployeeName(req.employeeId).replace(/"/g, '""');
      const statusLabel = req.status === RequestStatus.APPROVED ? 'APROVADO' : 'REPROVADO';

      req.items.forEach(item => {
        csvRows.push([
          item.material.sku,
          `"${item.material.description.replace(/"/g, '""')}"`,
          `"${rigName}"`,
          `"${empName}"`,
          req.employeeId,
          item.quantity,
          item.material.unit,
          statusLabel
        ].join(","));
      });
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sondalog_export_${activeHistoryTab}.csv`;
    link.click();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4 || newPassword !== confirmPassword) {
      setPasswordError('Verifique a senha (mínimo 4 caracteres).');
      return;
    }
    onChangePassword(newPassword);
    alert('Senha alterada!');
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
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Alterar Senha
          </button>
      </div>

      {/* Pending Section */}
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Aguardando Sua Análise
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">
              {pendingRequests.length} pendentes
            </span>
          </h2>
          
          {selectedPendingIds.size > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-2 rounded-lg animate-in slide-in-from-right-4">
              <span className="text-xs font-semibold text-blue-700 px-2">{selectedPendingIds.size} selecionados:</span>
              <button 
                onClick={handleBulkReject}
                className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-xs font-bold hover:bg-red-50"
              >
                Negar Selecionados
              </button>
              <button 
                onClick={handleBulkApprove}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 shadow-sm"
              >
                Aprovar Selecionados
              </button>
              <button onClick={() => setSelectedPendingIds(new Set())} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {pendingRequests.length > 0 && (
            <button 
              onClick={toggleAllPending}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              {selectedPendingIds.size === pendingRequests.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedPendingIds.size === pendingRequests.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          )}
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">Tudo em dia!</p>
              <p className="text-slate-400 text-sm">Nenhuma solicitação pendente para você.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingRequests.map((req) => (
              <div 
                key={req.id} 
                className={`bg-white rounded-xl border transition-all ${selectedPendingIds.has(req.id) ? 'border-blue-500 ring-2 ring-blue-50 shadow-md' : 'border-slate-200 shadow-sm'}`}
              >
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => togglePendingSelection(req.id)}
                      className={`transition-colors ${selectedPendingIds.has(req.id) ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {selectedPendingIds.has(req.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                    </button>
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {getRigName(req.rigId)}
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">#{req.id}</span>
                      </h3>
                      <p className="text-sm text-slate-500">
                        Solicitante: <span className="text-slate-700 font-semibold">{getEmployeeName(req.employeeId)}</span> 
                        <span className="text-slate-300 mx-2">|</span>
                        Mat: <span className="font-mono text-slate-600">{req.employeeId}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingRequestId === req.id ? (
                      <button
                        onClick={cancelEditing}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(req)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                      >
                        <Pencil className="w-4 h-4" /> Editar Qtds
                      </button>
                    )}
                    
                    <button
                      onClick={() => onUpdateStatus(req.id, RequestStatus.REJECTED)}
                      className="px-4 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-bold"
                    >
                      Negar
                    </button>
                    <button
                      onClick={() => editingRequestId === req.id ? saveItemChanges(req.id) : onUpdateStatus(req.id, RequestStatus.APPROVED)}
                      className="flex items-center gap-1 px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-bold shadow-sm"
                    >
                      {editingRequestId === req.id ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      {editingRequestId === req.id ? 'Salvar e Validar' : 'Aprovar'}
                    </button>
                  </div>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 bg-slate-50/30 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                        <th className="text-left px-6 py-2">SKU</th>
                        <th className="text-left px-6 py-2">Descrição</th>
                        <th className="text-right px-6 py-2">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(editingRequestId === req.id ? tempItems : req.items).map((item, idx) => (
                        <tr key={idx} className={editingRequestId === req.id ? "bg-blue-50/20" : ""}>
                          <td className="px-6 py-3 text-slate-500 font-mono text-xs">{item.material.sku}</td>
                          <td className="px-6 py-3 text-slate-700 font-medium">{item.material.description}</td>
                          <td className="px-6 py-3 text-right">
                            {editingRequestId === req.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <input 
                                  type="number"
                                  className="w-20 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-right font-bold text-blue-700"
                                  value={item.quantity}
                                  onChange={(e) => handleTempQtyChange(idx, e.target.value)}
                                  autoFocus={idx === 0}
                                />
                                <span className="text-xs text-slate-400 font-bold">{item.material.unit}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-900">{item.quantity} <span className="text-[10px] text-slate-400 uppercase">{item.material.unit}</span></span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-2 bg-slate-50/30 text-[10px] text-slate-400 text-right">
                  Criada em: {new Date(req.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="border-t border-slate-200 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                {activeHistoryTab === 'approved' ? <Clock className="w-5 h-5 text-slate-400" /> : <Trash2 className="w-5 h-5 text-red-500" />}
                {activeHistoryTab === 'approved' ? 'Histórico de Aprovados' : 'Lixeira'}
              </h2>
              
              <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => { setActiveHistoryTab('approved'); setSelectedHistoryIds(new Set()); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeHistoryTab === 'approved' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Aprovados
                  </button>
                  <button
                    onClick={() => { setActiveHistoryTab('rejected'); setSelectedHistoryIds(new Set()); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${activeHistoryTab === 'rejected' ? 'bg-red-50 text-red-700 shadow-sm border border-red-100' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Lixeira <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{rejectedRequests.length}</span>
                  </button>
              </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={selectedHistoryIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV ({selectedHistoryIds.size})
          </button>
        </div>
        
        {currentHistoryList.length > 0 ? (
          <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${activeHistoryTab === 'rejected' ? 'border-red-100' : 'border-slate-200'}`}>
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={currentHistoryList.length > 0 && selectedHistoryIds.size === currentHistoryList.length}
                        onChange={toggleAllHistory}
                      />
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sonda</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solicitante</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resumo</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 text-sm">
                {currentHistoryList.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedHistoryIds.has(req.id)}
                            onChange={() => toggleHistorySelection(req.id)}
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{getRigName(req.rigId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        <span className="font-semibold">{getEmployeeName(req.employeeId)}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">MAT: {req.employeeId}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                        <div className="max-w-xs truncate text-xs" title={req.items.map(i => `${i.quantity}x ${i.material.description}`).join(', ')}>
                            {req.items.length} itens: {req.items[0].material.description} {req.items.length > 1 ? `(+${req.items.length - 1})` : ''}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {activeHistoryTab === 'approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                            Aprovado
                          </span>
                      ) : (
                          <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => onUpdateStatus(req.id, RequestStatus.APPROVED)}
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Restaurar e Aprovar"
                              >
                                  <Undo2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { if(confirm('Excluir permanentemente?')) onDeleteRequest(req.id) }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir Definitivamente"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
           <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
              Nada para mostrar aqui no momento.
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Lock className="w-6 h-6 text-slate-600" /></div>
              <h3 className="text-lg font-bold text-slate-800">Alterar Senha</h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input type="password" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha (min 4)..." />
              <input type="password" required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a senha..." />
              {passwordError && <p className="text-xs text-red-500 font-medium">{passwordError}</p>}
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};