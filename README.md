# 🌍 SmartTrip - Assistente Inteligente de Viagens

> SmartTrip é uma aplicação web fullstack com Inteligência Artificial Generativa desenvolvida para planejar, gerar e personalizar roteiros turísticos dia a dia com base em períodos de folga, previsões meteorológicas e preferências do usuário.

---

## 📋 Especificações e Documentação
A especificação mestre completa com requisitos rastreáveis, arquitetura, modelo de dados e critérios de aceite está disponível em:
- [SPEC Mestre do SmartTrip](docs/specs/smarttrip-mestre.md) ou [spec.md](spec.md)

---

## 🛠️ Stack Tecnológica
- **Frontend / UI:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Build & Dev:** Vite.
- **Autenticação & Banco:** Firebase Authentication e Cloud Firestore *(planejados conforme SPEC)*.
- **Inteligência Artificial:** Google Gemini API (`@google/genai`).
- **Deploy:** Vercel.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js:** Versão mínima **v20.0.0 LTS** (Recomendado: v22+ ou v24+)
- **NPM:** Versão mínima **v10.0.0**
- Documentação operacional detalhada: [setup-operacional.md](docs/specs/setup-operacional.md)

### Passo a Passo

1. **Clone o repositório e acesse a pasta:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd "aula final"
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo de exemplo e crie o seu arquivo local:
   ```bash
   cp .env.example .env.local
   ```
   Abra `.env.local` e configure suas chaves (por exemplo, `GEMINI_API_KEY`).  
   > ⚠️ **Atenção:** Arquivos `.env*` locais são ignorados pelo Git e **nunca** devem ser commitados.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

---

## 🔍 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento local |
| `npm run lint` | Executa a verificação estática de tipos com TypeScript (`tsc --noEmit`) |
| `npm run build` | Compila o projeto para produção no diretório `dist/` |
| `npm run preview` | Pré-visualiza o build de produção localmente |

---

## 📁 Estrutura de Pastas

```text
├── docs/                     # Documentações do projeto
│   └── specs/                # Especificações funcionais e técnicas (SPEC mestre)
├── src/                      # Código fonte da aplicação
│   ├── components/           # Componentes de interface compartilhados e telas
│   ├── data/                 # Dados estáticos, mocks e constantes
│   ├── modules/              # Módulos de domínio orientados a SPEC
│   │   ├── auth/             # Autenticação e sessão (Firebase Auth)
│   │   ├── profile/          # Perfil do usuário e períodos de folga
│   │   └── trips/            # Gestão e revisão de viagens
│   ├── services/             # Integrações externas (Gemini, Clima, Geocoding)
│   ├── types.ts              # Definições de tipos TypeScript
│   ├── index.css             # Estilos globais e tokens Tailwind
│   ├── main.tsx              # Ponto de entrada React
│   └── App.tsx               # Componente raiz da aplicação
├── .env.example              # Modelo de variáveis de ambiente (sem secrets)
├── .gitignore                # Proteção contra commit de secrets e artefatos de build
└── package.json              # Dependências e scripts do ecossistema
```

---

## 🔒 Segurança
- Nenhuma chave secreta ou credencial sensível deve ser comitada no repositório.
- Chaves do cliente Firebase e Google Gemini devem ser injetadas exclusivamente via `.env.local` localmente ou pelas variáveis de ambiente da plataforma de hospedagem (Vercel).

# aulafinal
