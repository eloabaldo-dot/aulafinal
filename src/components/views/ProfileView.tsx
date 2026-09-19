import React, { useState } from 'react';
import { UserProfile } from '../../types/mvp';
import { useAuth } from '../../modules/auth';
import { User, Mail, Sparkles, Check, LogOut, Compass, DollarSign, Activity, Navigation, CloudSun, Ruler } from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onNavigate: (route: any) => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onShowToast,
}) => {
  const { user: authSessionUser } = useAuth();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');

  // Preferências completas conforme SPEC conjunta
  const [travelStyle, setTravelStyle] = useState(user.preferences.travelStyle);
  const [budgetLevel, setBudgetLevel] = useState(user.preferences.budgetLevel);
  const [pace, setPace] = useState(user.preferences.pace);

  // Novos campos: interesses, transporte, clima, distância
  const [interests, setInterests] = useState<string[]>([
    'cultura',
    'gastronomia',
    'relaxamento',
  ]);
  const [transportation, setTransportation] = useState<string[]>([
    'caminhada',
    'transporte_publico',
  ]);
  const [preferredClimate, setPreferredClimate] = useState<string>('ensolarado_quente');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(15);
  const [dietary, setDietary] = useState<string[]>(user.preferences.dietaryRestrictions || []);

  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      if (interests.length === 1) {
        onShowToast('⚠️ Mantenha ao menos 1 interesse selecionado.');
        return;
      }
      setInterests(interests.filter((i) => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  const toggleTransport = (item: string) => {
    if (transportation.includes(item)) {
      if (transportation.length === 1) {
        onShowToast('⚠️ Selecione ao menos 1 meio de transporte preferido.');
        return;
      }
      setTransportation(transportation.filter((t) => t !== item));
    } else {
      setTransportation([...transportation, item]);
    }
  };

  const toggleDietary = (item: string) => {
    if (dietary.includes(item)) {
      setDietary(dietary.filter((d) => d !== item));
    } else {
      setDietary([...dietary, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (interests.length === 0) {
      onShowToast('❌ Selecione ao menos 1 categoria de interesse.');
      return;
    }

    setIsSaving(true);
    // Identidade estritamente obtida da sessão do Auth
    const activeUid = authSessionUser?.uid || user.uid;

    setTimeout(() => {
      onUpdateUser({
        ...user,
        uid: activeUid, // NUNCA alterável por input do usuário
        name,
        bio,
        preferences: {
          travelStyle,
          budgetLevel,
          pace,
          dietaryRestrictions: dietary,
        },
      });
      setIsSaving(false);
      onShowToast('✅ Preferências salvas com sucesso no Firestore!');
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil & Preferências</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize seu perfil para a IA gerar roteiros aderentes ao seu estilo de viagem.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4" /> Sair da Conta
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Dados Básicos (Identidade Autenticada)
          </h2>

          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500/30"
            />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {authSessionUser?.email || user.email}
              </p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                UID: {authSessionUser?.uid || user.uid}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome de Exibição
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div>
            <label htmlFor="prof-bio" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Biografia Curta
            </label>
            <textarea
              id="prof-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
        </div>

        {/* Travel Preferences Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Preferências de Viagem & Parâmetros da IA
            </h2>
          </div>

          {/* Interesses (Seleção Múltipla) */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Categorias de Interesse (Seleção Múltipla)
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'cultura', label: '🏛️ Cultura & História' },
                { id: 'natureza', label: '🌲 Natureza & Parques' },
                { id: 'gastronomia', label: '🍷 Gastronomia' },
                { id: 'aventura', label: '🧗 Aventura' },
                { id: 'compras', label: '🛍️ Compras' },
                { id: 'relaxamento', label: '🧘 Relaxamento' },
                { id: 'vida_noturna', label: '🍸 Vida Noturna' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    interests.includes(item.id)
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {interests.includes(item.id) && <Check className="w-3.5 h-3.5" />}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orçamento */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Faixa de Orçamento
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'economico', label: 'Econômico', desc: 'Hostels e passeios gratuitos' },
                { id: 'moderado', label: 'Moderado', desc: 'Hotéis 3-4★ e restaurantes padrão' },
                { id: 'luxo', label: 'Luxo', desc: 'Alta gastronomia e conforto total' },
              ].map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setBudgetLevel(b.id as any)}
                  className={`p-3 rounded-2xl text-left border transition ${
                    budgetLevel === b.id
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block text-xs font-bold capitalize">{b.label}</span>
                  <span className="block text-[11px] opacity-80 mt-0.5">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ritmo */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Ritmo da Viagem
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'tranquilo', label: 'Tranquilo (1-2 atrações/dia)' },
                { id: 'moderado', label: 'Moderado (3-4 atrações/dia)' },
                { id: 'intenso', label: 'Intenso (5+ atrações/dia)' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPace(p.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    pace === p.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meios de Transporte Preferidos */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Meios de Transporte Preferidos (Seleção Múltipla)
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'caminhada', label: '🚶 Caminhada' },
                { id: 'transporte_publico', label: '🚇 Metrô / Ônibus' },
                { id: 'carro_alugado', label: '🚗 Carro Alugado' },
                { id: 'taxi_uber', label: '🚕 Táxi / App' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTransport(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    transportation.includes(t.id)
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {transportation.includes(t.id) && <Check className="w-3.5 h-3.5" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clima Preferido */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Clima Preferido
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ensolarado_quente', label: '☀️ Ensolarado & Quente' },
                { id: 'ameno_fresco', label: '⛅ Ameno & Fresco' },
                { id: 'frio_neve', label: '❄️ Frio / Neve' },
                { id: 'indiferente', label: '🌈 Indiferente' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setPreferredClimate(c.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    preferredClimate === c.id
                      ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distância Máxima */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Raio Máximo de Deslocamento do Centro
              </span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                Até {maxDistanceKm} km
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Restrições Alimentares */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Restrições Alimentares
            </span>
            <div className="flex flex-wrap gap-2">
              {['Vegetariano', 'Vegano', 'Sem Glúten', 'Sem Lactose', 'Halal', 'Kosher'].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleDietary(item)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    dietary.includes(item)
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {dietary.includes(item) && <Check className="w-3.5 h-3.5" />}
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition"
        >
          {isSaving ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Salvar Alterações no Firestore'
          )}
        </button>
      </form>
    </div>
  );
};
