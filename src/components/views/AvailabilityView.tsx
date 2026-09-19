import React, { useState } from 'react';
import { VacationPeriod } from '../../types/mvp';
import { useAuth } from '../../modules/auth';
import { Calendar, Plus, Trash2, Edit2, Clock, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface AvailabilityViewProps {
  vacations: VacationPeriod[];
  onAddVacation: (vacation: VacationPeriod) => void;
  onUpdateVacation?: (vacation: VacationPeriod) => void;
  onDeleteVacation: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export const AvailabilityView: React.FC<AvailabilityViewProps> = ({
  vacations,
  onAddVacation,
  onUpdateVacation,
  onDeleteVacation,
  onShowToast,
}) => {
  const { user: authSessionUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: VacationPeriod) => {
    setEditingId(v.id);
    setTitle(v.title);
    setStartDate(v.startDate);
    setEndDate(v.endDate);
    setNotes(v.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      setError('Preencha os campos obrigatórios (Título, Início e Término).');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('A data de término não pode ser anterior à data de início.');
      return;
    }

    const diffDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // A identidade é obtida do Auth, nunca de input do usuário
    const activeUid = authSessionUser?.uid || 'usr_current';

    if (editingId) {
      // Edição
      const updatedPeriod: VacationPeriod = {
        id: editingId,
        title: title.trim(),
        startDate,
        endDate,
        totalDays: diffDays,
        notes: notes.trim(),
      };
      if (onUpdateVacation) {
        onUpdateVacation(updatedPeriod);
      }
      onShowToast(`✏️ Período "${title}" atualizado com sucesso!`);
    } else {
      // Criação
      const newPeriod: VacationPeriod = {
        id: `vac_${Date.now()}_${activeUid.substring(0, 5)}`,
        title: title.trim(),
        startDate,
        endDate,
        totalDays: diffDays,
        notes: notes.trim(),
      };
      onAddVacation(newPeriod);
      onShowToast(`🎉 Período "${title}" adicionado à sua conta!`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Períodos de Folga & Férias</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre seus dias livres para o SmartTrip sugerir itinerários do tamanho exato da sua folga.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar Período
        </button>
      </div>

      {/* List of Vacations */}
      {vacations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Nenhum período de folga cadastrado</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Adicione suas próximas férias para gerarmos roteiros realistas e adaptados ao seu tempo livre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vacations.map((v) => (
            <div
              key={v.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                    {v.totalDays} dias livres
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(v)}
                      aria-label={`Editar período ${v.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteVacation(v.id);
                        onShowToast('Período excluído.');
                      }}
                      aria-label={`Excluir período ${v.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{v.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                  De {v.startDate} até {v.endDate}
                </p>
                {v.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-start gap-1.5 mt-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{v.notes}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Vacation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingId ? 'Editar Período de Folga' : 'Novo Período de Folga'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Título / Ocasião
                </label>
                <input
                  type="text"
                  placeholder="Ex: Férias de Outono"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Término
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Notas / Preferências do Período (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Não pretendo fazer voos de madrugada. Preferência por praia."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm"
                >
                  {editingId ? 'Salvar Edição' : 'Salvar Período'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
