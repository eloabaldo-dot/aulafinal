# Especificação Operacional: Inicialização e Reprodutibilidade do SmartTrip

**Documento:** `docs/specs/setup-operacional.md`  
**Status:** Aprovado  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md)  
**Objetivo:** Estabelecer diretrizes mandatórias e critérios estritamente verificáveis de engenharia de software para configuração, padronização de ambiente, gestão de segredos, versionamento e execução reproduzível do repositório SmartTrip por qualquer colaborador, aluno ou avaliador.

---

## 1. Versão Mínima Esperada do Node.js

- **Versão Mínima Homologada:** **Node.js v20.0.0 LTS** (Recomendado: v22.x LTS ou v24.x LTS).
- **Justificativa Técnica:** O projeto utiliza React 19, Vite 8 e recursos nativos de ESM e APIs web globais (`fetch`, `crypto`, `structuredClone`) que exigem Node.js >= 20.
- **Critério Verificável (CV-001):**
  - A execução de `node -v` no terminal deve retornar um valor semântico maior ou igual a `v20.0.0`.
  - Tentativas de compilação em versões legadas (Node.js < 20) devem falhar ou ser explicitamente bloqueadas.

---

## 2. Gerenciador de Pacotes e Lockfile

- **Gerenciador Oficial:** **NPM** (Node Package Manager).
- **Versão Mínima:** **v10.0.0**.
- **Arquivo de Trava Determinístico:** O arquivo `package-lock.json` deve estar estritamente versionado na raiz do repositório.
- **Regra de Unicidade:** É terminantemente proibido versionar arquivos de trava concorrentes (`yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`).
- **Critério Verificável (CV-002):**
  - O comando `npm -v` deve retornar versão `>= 10.0.0`.
  - A execução de `npm ci` ou `npm install --legacy-peer-deps` deve ler exclusivamente o `package-lock.json` gerando uma pasta `node_modules` íntegra sem alterar os hashes das dependências travadas.

---

## 3. Scripts Obrigatórios no `package.json`

O arquivo `package.json` deve disponibilizar, de forma padronizada e multiplataforma (Windows PowerShell/CMD, Linux e macOS), os seguintes scripts com critérios de sucesso verificáveis:

| Script | Comando Padrão | Propósito | Critério Verificável de Sucesso |
|---|---|---|---|
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Inicialização do servidor local de desenvolvimento | O processo deve abrir a porta 3000, responder `HTTP 200` em `http://localhost:3000` em menos de 3s e manter o processo ativo sem erros não capturados. |
| `npm run lint` | `tsc --noEmit` | Verificação estática de tipagem e integridade do código | O comando deve analisar 100% dos arquivos TypeScript (`.ts`, `.tsx`) e finalizar com código de saída `0` (zero diagnósticos de erro). |
| `npm run build` | `vite build` | Compilação e empacotamento dos artefatos de produção | O comando deve gerar o diretório `dist/` contendo `index.html` e os bundles estáticos de JS e CSS, finalizando com código de saída `0`. |
| `npm run preview` | `vite preview` | Pré-visualização local dos artefatos compilados em `dist/` | O processo deve servir os arquivos estáticos de produção na porta configurada pelo Vite. |

---

## 4. Estratégia de `.env.example` e `.env.local`

### 4.1. Regras para o `.env.example` (Versionado)
- **Obrigatoriedade:** Deve residir na raiz do projeto e estar rastreado no Git.
- **Higiene Estrita:** NUNCA deve conter valores reais, chaves privadas, senhas ou tokens ativos.
- **Conteúdo Padronizado:** Deve listar todas as variáveis consumidas pela aplicação com valores em branco ou placeholders descritivos, acompanhadas de instruções de onde obtê-las.
- **Mapeamento Obrigatório:**
  ```env
  # Google Gemini API
  GEMINI_API_KEY=

  # Firebase Client SDK
  VITE_FIREBASE_API_KEY=
  VITE_FIREBASE_AUTH_DOMAIN=
  VITE_FIREBASE_PROJECT_ID=
  VITE_FIREBASE_STORAGE_BUCKET=
  VITE_FIREBASE_MESSAGING_SENDER_ID=
  VITE_FIREBASE_APP_ID=

  # URL Base da Aplicação
  APP_URL=http://localhost:3000
  ```

### 4.2. Regras para o `.env.local` (Não Versionado)
- **Origem:** Criado exclusivamente pelo desenvolvedor localmente através da cópia manual do template: `cp .env.example .env.local`.
- **Preenchimento:** Recebe as chaves de API individuais e credenciais locais do desenvolvedor.
- **Resiliência:** A aplicação deve inicializar mesmo na ausência de chaves opcionais no `.env.local`, apresentando alertas de configuração ou telas de fallback elegantes, sem tela branca (*white screen of death*).

---

## 5. Diretrizes do `.gitignore` e Blindagem de Segredos

O arquivo `.gitignore` na raiz do projeto é a barreira mandante contra vazamento acidental de credenciais e injeção de lixo de build no repositório.

### 5.1. Regras Mandatórias de Bloqueio
```gitignore
# Dependências e Builds
node_modules/
dist/
build/
coverage/
.next/
out/

# Segredos, Chaves e Arquivos de Ambiente (Mandatório)
.env
.env.*
.env.local
.env.development.local
.env.test.local
.env.production.local
serviceAccountKey.json
firebase-admin-key.json
*.pem
*.key

# Exceção Explícita para Templates de Configuração
!.env.example
!.env.test.example

# Arquivos de Sistema e Logs
*.log
npm-debug.log*
.DS_Store
Thumbs.db
```

### 5.2. Critério Verificável (CV-003):
- A execução de `git check-ignore -v .env .env.local serviceAccountKey.json` deve comprovar correspondência ativa contra as linhas do `.gitignore`.
- O comando `git status --porcelain` executado após a criação de um arquivo `.env.local` não deve listar o arquivo em hipótese alguma.

---

## 6. Convenção de Branches

Para assegurar rastreabilidade com a SPEC mestre e estabilidade da linha principal, o repositório segue o padrão GitHub Flow associado aos IDs estáveis do projeto:

### 6.1. Branch Principal
- `main`: Branch protegida, contendo o código de produção estável e homologado para deploy automático na Vercel.

### 6.2. Branches de Trabalho (Nomenclatura Obrigatória)
Padrão: `<tipo>/<id-estavel-spec>-<descricao-curta>`

- **Tipos Permitidos:**
  - `feat`: Desenvolvimento de funcionalidade ou requisito funcional (ex: `feat/rf-001-firebase-auth`).
  - `fix`: Correção de defeito ou falha em critério de aceite (ex: `fix/ca-003-validacao-json-gemini`).
  - `docs`: Modificações em especificações, guias ou README (ex: `docs/setup-operacional`).
  - `refactor`: Refatoração estrutural sem alteração funcional.
  - `chore`: Atualização de tooling, pacotes ou scripts.

---

## 7. Convenção de Commits (Conventional Commits 1.0.0)

Todos os commits devem aderir à especificação **Conventional Commits 1.0.0**, incorporando referências aos requisitos da SPEC mestre:

### 7.1. Estrutura do Commit
```text
<tipo>(<escopo opcional>): <descrição no imperativo e em minúsculas> [ID-SPEC]
```

### 7.2. Tabela de Tipos e Exemplos Verificáveis
| Tipo | Quando Usar | Exemplo Conforme |
|---|---|---|
| `feat` | Adição de novo recurso | `feat(auth): adiciona autenticacao com google oauth [RF-001]` |
| `fix` | Correção de bug | `fix(trips): impede submissao de viagem com datas invertidas [RN-001]` |
| `docs` | Alterações puramente em documentação | `docs: documenta especificacao operacional de inicializacao` |
| `style` | Ajustes visuais, CSS ou formatação | `style(nav): ajusta espacamento e contraste no modo escuro` |
| `refactor` | Mudança de código que não altera comportamento | `refactor(services): desacopla cliente http de geocoding` |
| `test` | Adição ou correção de testes | `test(rules): adiciona assercoes de seguranca do firestore [RN-003]` |
| `chore` | Manutenção de build ou dependências | `chore(deps): atualiza configuracoes do vite e typescript` |

---

## 8. Requisitos Obrigatórios para o `README.md`

O `README.md` do repositório deve obrigatoriamente fornecer aos novos desenvolvedores todas as informações necessárias para operar o projeto sem necessidade de suporte verbal:

1. **Visão Geral e Propósito:** Descrição executiva do SmartTrip, seu objetivo como assistente de viagens com IA e sua proposta de valor.
2. **Links Diretos para as SPECs:** Links clicáveis para `docs/specs/smarttrip-mestre.md` e `docs/specs/setup-operacional.md`.
3. **Tech Stack & Requisitos de Sistema:** Lista explícita das tecnologias (React 19, TypeScript, Tailwind, Vite, Firebase, Gemini) e versões mínimas exigidas de Node.js e NPM.
4. **Guia Passo a Passo de Execução Local:** Comandos literais para clone, instalação de dependências, configuração do `.env.local` e inicialização.
5. **Matriz de Scripts:** Tabela documentando o propósito de cada script do `package.json` (`dev`, `lint`, `build`, `preview`).
6. **Arquitetura de Diretórios:** Diagrama de pastas demonstrando a segregação entre `docs/`, `src/components/`, `src/modules/` e `src/services/`.
7. **Boas Práticas de Segurança:** Instrução explícita alertando que nenhuma chave de API deve ser comitada.

---

## 9. Critérios para Considerar o Ambiente Reproduzível

O ambiente do SmartTrip é formalmente declarado **reproduzível** quando atender, de forma automatizada e simultânea, a todos os 6 critérios a seguir:

- **CR-001 (Resolução Determinística):** A execução de `npm install` (ou `npm install --legacy-peer-deps`) a partir de um clone limpo conclui sem erros de compilação de código nativo.
- **CR-002 (Integridade de Tipos):** O comando `npm run lint` executa sobre a totalidade do código TypeScript e retorna código de saída `0`.
- **CR-003 (Compilação Bem-Sucedida):** O comando `npm run build` empacota a aplicação gerando o diretório `dist/` com todos os bundles estáticos sem avisos de quebra.
- **CR-004 (Operação Local Verificada):** O comando `npm run dev` disponibiliza a interface funcional na porta 3000 em menos de 3 segundos.
- **CR-005 (Isolamento de Segredos Homologado):** O repositório não possui nenhum arquivo `.env` ou credencial privada rastreada pelo Git (`git log` e `git status` limpos de dados sensíveis).
- **CR-006 (Portabilidade Operacional):** Os scripts funcionam de maneira idêntica em terminais Windows PowerShell, Linux Bash e macOS Zsh sem exigência de flags proprietárias de SO.

---

## 10. Checklist de Validação para Outro Aluno / Avaliador

Checklist sequencial de conformidade que deve ser executado para atestar que o repositório está pronto para clone e desenvolvimento:

```markdown
- [ ] 1. Clonar o repositório em uma pasta local virgem:
       git clone <URL_DO_REPOSITORIO> && cd "aula final"
- [ ] 2. Checar se a versão do Node atende ao requisito:
       node -v  # Deve retornar >= v20.0.0
- [ ] 3. Checar se a versão do NPM atende ao requisito:
       npm -v   # Deve retornar >= v10.0.0
- [ ] 4. Instalar dependências a partir do lockfile:
       npm install --legacy-peer-deps
- [ ] 5. Criar o arquivo de variáveis locais:
       cp .env.example .env.local  (ou Copy-Item no PowerShell)
- [ ] 6. Auditar a blindagem de segredos:
       git status --porcelain  # Confirme que .env.local NÃO aparece na listagem
- [ ] 7. Executar a checagem de tipos estáticos:
       npm run lint  # Deve finalizar com código de saída 0
- [ ] 8. Executar o empacotamento de produção:
       npm run build  # Deve gerar a pasta dist/ com código de saída 0
- [ ] 9. Executar a aplicação em desenvolvimento:
       npm run dev  # Abrir http://localhost:3000 e verificar carregamento da interface
```
