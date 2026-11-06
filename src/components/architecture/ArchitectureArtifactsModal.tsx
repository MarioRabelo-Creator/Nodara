/**
 * Technical Specification & Architectural Artifacts Explorer
 * Section 15 of user documentation:
 * - 15.1. Diagrama Entidade-Relacionamento (DER) do banco SQLite
 * - 15.2. Protocolo de Sincronização com Google Drive
 * - 15.3. Formato Estruturado dos Documentos Tradicionais (JSON/AST)
 */

import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  Code2,
  FileText,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Shield,
  Cloud,
  HardDrive,
  Workflow,
  Sparkles,
  Server
} from 'lucide-react';

interface ArchitectureArtifactsModalProps {
  onClose?: () => void;
}

export const ArchitectureArtifactsModal: React.FC<ArchitectureArtifactsModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'der' | 'sync' | 'ast'>('der');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>('Nota');

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // 16 SQLite Entities defined in Section 13 & 15.1
  const entities = [
    {
      name: 'Usuario',
      table: 'usuarios',
      pk: 'id',
      description: 'Conta global do usuário no ecossistema',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'Identificador único UUID v4' },
        { name: 'google_id', type: 'TEXT UNIQUE', desc: 'Identificador OAuth 2.0 da conta Google' },
        { name: 'email', type: 'TEXT UNIQUE', desc: 'E-mail do titular' },
        { name: 'criado_em', type: 'DATETIME', desc: 'Data de criação do registro' },
      ],
      relations: ['1:N Perfis', '1:N ContasAutenticacao', '1:N Dispositivos'],
    },
    {
      name: 'Perfil',
      table: 'perfis',
      pk: 'id',
      description: 'Perfil individual de uso para isolamento completo de dados',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID v4 do perfil' },
        { name: 'usuario_id', type: 'TEXT', isFk: true, desc: 'FK para usuarios.id' },
        { name: 'nome_exibicao', type: 'TEXT', desc: 'Nome visível do perfil' },
        { name: 'foto_url', type: 'TEXT', desc: 'Avatar customizado ou Google' },
        { name: 'ativo', type: 'INTEGER', desc: '1 para ativo, 0 para inativo' },
      ],
      relations: ['1:N EspacosTrabalho', '1:N Preferencias', '1:N FilaSincronizacao'],
    },
    {
      name: 'EspacoTrabalho',
      table: 'espacos_trabalho',
      pk: 'id',
      description: 'Raiz organizacional do usuário (ex: Engenharia, Pessoal)',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID do espaço' },
        { name: 'perfil_id', type: 'TEXT', isFk: true, desc: 'FK para perfis.id' },
        { name: 'nome', type: 'TEXT', desc: 'Nome do espaço de trabalho' },
        { name: 'icone', type: 'TEXT', desc: 'Identificador do ícone Lucide' },
        { name: 'cor', type: 'TEXT', desc: 'Código hexadecimal da cor' },
      ],
      relations: ['1:N Cadernos'],
    },
    {
      name: 'Caderno',
      table: 'cadernos',
      pk: 'id',
      description: 'Coleção temática de pastas e documentos',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID do caderno' },
        { name: 'espaco_id', type: 'TEXT', isFk: true, desc: 'FK para espacos_trabalho.id' },
        { name: 'nome', type: 'TEXT', desc: 'Nome do caderno' },
        { name: 'icone', type: 'TEXT', desc: 'Ícone temático' },
      ],
      relations: ['1:N Pastas', '1:N Notas', '1:N Documentos'],
    },
    {
      name: 'Pasta',
      table: 'pastas',
      pk: 'id',
      description: 'Estrutura em árvore hierárquica (Nested) para notas e documentos',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID da pasta' },
        { name: 'caderno_id', type: 'TEXT', isFk: true, desc: 'FK para cadernos.id' },
        { name: 'pasta_pai_id', type: 'TEXT NULL', isFk: true, desc: 'Auto-relacionamento hierárquico' },
        { name: 'nome', type: 'TEXT', desc: 'Nome da pasta' },
      ],
      relations: ['1:N Pastas Filhas', '1:N Notas', '1:N Documentos'],
    },
    {
      name: 'Nota',
      table: 'notas',
      pk: 'id',
      description: 'Nota atômica independente estilo Obsidian em Markdown (.md)',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID da nota' },
        { name: 'perfil_id', type: 'TEXT', isFk: true, desc: 'FK para perfis.id' },
        { name: 'caderno_id', type: 'TEXT', isFk: true, desc: 'FK para cadernos.id' },
        { name: 'pasta_id', type: 'TEXT NULL', isFk: true, desc: 'FK para pastas.id' },
        { name: 'titulo', type: 'TEXT', desc: 'Título da nota' },
        { name: 'caminho_arquivo_md', type: 'TEXT', desc: 'Caminho no disco ou Drive (.md)' },
        { name: 'favorito', type: 'INTEGER', desc: 'Booleano 0/1' },
        { name: 'excluido', type: 'INTEGER', desc: 'Lixeira (Soft delete) 0/1' },
      ],
      relations: ['1:N LinksInternos (Origem/Destino)', 'N:M Etiquetas', '1:N Versoes', '1:N Anexos'],
    },
    {
      name: 'Documento',
      table: 'documentos',
      pk: 'id',
      description: 'Documento tradicional paginado estilo Word em JSON/AST',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID do documento' },
        { name: 'perfil_id', type: 'TEXT', isFk: true, desc: 'FK para perfis.id' },
        { name: 'caderno_id', type: 'TEXT', isFk: true, desc: 'FK para cadernos.id' },
        { name: 'pasta_id', type: 'TEXT NULL', isFk: true, desc: 'FK para pastas.id' },
        { name: 'titulo', type: 'TEXT', desc: 'Título formal' },
        { name: 'ast_json', type: 'TEXT (JSON)', desc: 'Estrutura JSON/AST completa' },
        { name: 'tamanho_papel', type: 'TEXT', desc: 'A4, Letter ou Legal' },
        { name: 'orientacao', type: 'TEXT', desc: 'portrait ou landscape' },
        { name: 'total_paginas', type: 'INTEGER', desc: 'Contagem de páginas' },
      ],
      relations: ['1:N Versoes', '1:N Anexos', '1:N LinksInternos'],
    },
    {
      name: 'LinkInterno',
      table: 'links_internos',
      pk: 'id',
      description: 'Conexões hipertextuais bidirecionais [[Nota]]',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID da conexão' },
        { name: 'origem_id', type: 'TEXT', desc: 'ID do item originador' },
        { name: 'tipo_origem', type: 'TEXT', desc: 'nota ou documento' },
        { name: 'titulo_destino', type: 'TEXT', desc: 'Alvo citado entre [[ ]]' },
        { name: 'destino_id', type: 'TEXT NULL', desc: 'ID resolvido quando encontrado' },
      ],
      relations: ['N:1 Nota/Documento'],
    },
    {
      name: 'FilaSincronizacao',
      table: 'fila_sincronizacao',
      pk: 'id',
      description: 'Operações pendentes para garantir funcionamento Offline-First',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID da operação' },
        { name: 'perfil_id', type: 'TEXT', isFk: true, desc: 'FK para perfis.id' },
        { name: 'tipo_entidade', type: 'TEXT', desc: 'nota, documento, pasta, etc.' },
        { name: 'entidade_id', type: 'TEXT', desc: 'ID do objeto alterado' },
        { name: 'operacao', type: 'TEXT', desc: 'CREATE, UPDATE, DELETE, MOVE' },
        { name: 'dados_payload', type: 'TEXT (JSON)', desc: 'Snapshot dos dados a enviar' },
        { name: 'status', type: 'TEXT', desc: 'PENDING, SYNCED, CONFLICT, FAILED' },
        { name: 'tentativas', type: 'INTEGER', desc: 'Contador de retentativas' },
      ],
      relations: ['N:1 Perfil'],
    },
    {
      name: 'ContaNuvem',
      table: 'contas_nuvem',
      pk: 'id',
      description: 'Metadados da pasta e cota do Google Drive',
      columns: [
        { name: 'id', type: 'TEXT', isPk: true, desc: 'UUID da conta' },
        { name: 'provedor', type: 'TEXT', desc: 'google_drive' },
        { name: 'email', type: 'TEXT', desc: 'E-mail autenticado' },
        { name: 'pasta_raiz_id', type: 'TEXT', desc: 'ID da pasta "Meu Aplicativo"' },
        { name: 'ultima_sincronizacao', type: 'DATETIME', desc: 'Timestamp do último sync' },
      ],
      relations: ['1:1 Perfil'],
    },
  ];

  // SQLite Schema DDL
  const sqliteDDL = `-- ============================================================
-- NODARA - BANCO DE DADOS LOCAL SQLITE
-- Especificação Técnica v1.0 — Diagrama Entidade-Relacionamento
-- ============================================================

PRAGMA foreign_keys = ON;

-- 1. Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Perfis
CREATE TABLE IF NOT EXISTS perfis (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_exibicao TEXT NOT NULL,
    foto_url TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Espaços de Trabalho
CREATE TABLE IF NOT EXISTS espacos_trabalho (
    id TEXT PRIMARY KEY,
    perfil_id TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    icone TEXT DEFAULT 'Layers',
    cor TEXT DEFAULT '#4f46e5',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cadernos
CREATE TABLE IF NOT EXISTS cadernos (
    id TEXT PRIMARY KEY,
    espaco_id TEXT NOT NULL REFERENCES espacos_trabalho(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    icone TEXT DEFAULT 'BookOpen',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pastas (Nested Hierárquico)
CREATE TABLE IF NOT EXISTS pastas (
    id TEXT PRIMARY KEY,
    caderno_id TEXT NOT NULL REFERENCES cadernos(id) ON DELETE CASCADE,
    pasta_pai_id TEXT REFERENCES pastas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notas Independentes (Obsidian .md)
CREATE TABLE IF NOT EXISTS notas (
    id TEXT PRIMARY KEY,
    perfil_id TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    caderno_id TEXT NOT NULL REFERENCES cadernos(id) ON DELETE CASCADE,
    pasta_id TEXT REFERENCES pastas(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    conteudo_md TEXT NOT NULL,
    favorito INTEGER DEFAULT 0,
    excluido INTEGER DEFAULT 0,
    excluido_em DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Documentos Tradicionais (Word AST JSON)
CREATE TABLE IF NOT EXISTS documentos (
    id TEXT PRIMARY KEY,
    perfil_id TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    caderno_id TEXT NOT NULL REFERENCES cadernos(id) ON DELETE CASCADE,
    pasta_id TEXT REFERENCES pastas(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    ast_json TEXT NOT NULL,
    tamanho_papel TEXT DEFAULT 'A4',
    orientacao TEXT DEFAULT 'portrait',
    favorito INTEGER DEFAULT 0,
    excluido INTEGER DEFAULT 0,
    excluido_em DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Links Internos ([[Hipertexto]])
CREATE TABLE IF NOT EXISTS links_internos (
    id TEXT PRIMARY KEY,
    origem_id TEXT NOT NULL,
    tipo_origem TEXT NOT NULL, -- 'nota' ou 'documento'
    titulo_destino TEXT NOT NULL,
    destino_id TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Fila de Sincronização Offline
CREATE TABLE IF NOT EXISTS fila_sincronizacao (
    id TEXT PRIMARY KEY,
    perfil_id TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    tipo_entidade TEXT NOT NULL,
    entidade_id TEXT NOT NULL,
    operacao TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'MOVE'
    dados_payload TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SYNCED', 'CONFLICT'
    tentativas INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_notas_titulo ON notas(titulo);
CREATE INDEX IF NOT EXISTS idx_docs_titulo ON documentos(titulo);
CREATE INDEX IF NOT EXISTS idx_links_destino ON links_internos(titulo_destino);
CREATE INDEX IF NOT EXISTS idx_sync_status ON fila_sincronizacao(status);
`;

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-100 overflow-hidden select-text">
      {/* HEADER */}
      <div className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Workflow className="w-4 h-4" />
            Especificação & Arquitetura Técnica (Seção 15)
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">
            Artefatos Técnicos do Sistema
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
          <button
            onClick={() => setActiveTab('der')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'der'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            15.1. DER & SQLite
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'sync'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            15.2. Protocolo de Sync
          </button>
          <button
            onClick={() => setActiveTab('ast')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ast'
                ? 'bg-blue-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            15.3. Formato AST JSON
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* =========================================================================
            TAB 1: DER & BANCO DE DADOS SQLITE
           ========================================================================= */}
        {activeTab === 'der' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Entity Picker List */}
              <div className="lg:col-span-1 bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-2">
                <div className="text-xs uppercase font-bold text-stone-400 mb-2 flex items-center justify-between">
                  <span>Tabelas do Modelo ({entities.length})</span>
                  <span className="text-[10px] text-indigo-400 font-mono">SQLite 3</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {entities.map(e => (
                    <button
                      key={e.name}
                      onClick={() => setSelectedEntity(e.name)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                        selectedEntity === e.name
                          ? 'bg-indigo-600/20 border border-indigo-500/50 text-white font-semibold'
                          : 'bg-stone-900/50 border border-stone-800/80 text-stone-300 hover:bg-stone-900'
                      }`}
                    >
                      <div>
                        <div className="text-stone-100">{e.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{e.table}</div>
                      </div>
                      <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded">
                        {e.columns.length} cols
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Entity Details */}
              <div className="lg:col-span-2 bg-stone-950 p-6 rounded-2xl border border-stone-800 flex flex-col gap-4">
                {(() => {
                  const current = entities.find(e => e.name === selectedEntity) || entities[0];
                  return (
                    <>
                      <div className="flex items-start justify-between border-b border-stone-800 pb-4">
                        <div>
                          <div className="text-lg font-bold text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-400" />
                            Entidade: {current.name}
                          </div>
                          <div className="text-xs text-stone-400 mt-1">{current.description}</div>
                        </div>
                        <span className="text-xs bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-mono px-3 py-1 rounded-full">
                          TABELA: {current.table}
                        </span>
                      </div>

                      {/* Columns Table */}
                      <div>
                        <div className="text-xs font-semibold text-stone-300 mb-2">Colunas & Tipos:</div>
                        <div className="rounded-xl border border-stone-800 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-stone-900 text-stone-400 text-left">
                              <tr>
                                <th className="p-2.5 font-semibold">Coluna</th>
                                <th className="p-2.5 font-semibold">Tipo</th>
                                <th className="p-2.5 font-semibold">Chave</th>
                                <th className="p-2.5 font-semibold">Descrição</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800/60">
                              {current.columns.map((c, i) => (
                                <tr key={i} className="hover:bg-stone-900/40">
                                  <td className="p-2.5 font-mono text-emerald-400 font-medium">{c.name}</td>
                                  <td className="p-2.5 font-mono text-stone-400">{c.type}</td>
                                  <td className="p-2.5">
                                    {c.isPk && (
                                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        PK
                                      </span>
                                    )}
                                    {c.isFk && (
                                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        FK
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-stone-400">{c.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Relations */}
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-stone-300 mb-2">Cardinalidades & Relacionamentos:</div>
                        <div className="flex flex-wrap gap-2">
                          {current.relations.map((r, i) => (
                            <span
                              key={i}
                              className="text-xs bg-stone-900 border border-stone-800 text-stone-300 px-3 py-1 rounded-lg flex items-center gap-1.5"
                            >
                              <ArrowRight className="w-3 h-3 text-indigo-400" />
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* DDL SQL SCRIPT */}
            <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Script DDL SQL Completo (SQLite 3)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(sqliteDDL, 'ddl')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
                >
                  {copiedSection === 'ddl' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar SQL DDL
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono text-stone-300 bg-stone-900/70 p-4 rounded-xl overflow-x-auto max-h-72 border border-stone-800/80">
                {sqliteDDL}
              </pre>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PROTOCOLO DE SINCRONIZAÇÃO COM GOOGLE DRIVE
           ========================================================================= */}
        {activeTab === 'sync' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                Máquina de Estados e Fluxo de Sincronização Bidirecional
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed mb-6">
                O <strong>Nodara</strong> adota o padrão <strong>Offline-First com Fila Transacional (SQLite SyncQueue)</strong>. Qualquer operação realizada sem internet é enfileirada localmente e despachada para o Google Drive assim que a conexão for reestabelecida.
              </p>

              {/* Visual Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">1</span>
                    Mutação Local
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Usuário edita nota ou doc. A alteração grava no SQLite local e gera registro com status <code className="text-amber-400">PENDING</code> na fila.
                  </p>
                </div>

                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">2</span>
                    Checagem de Rede
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    O cliente testa conectividade HTTPS e token OAuth Google Drive. Se offline, suspende o despachante sem interromper o usuário.
                  </p>
                </div>

                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">3</span>
                    Detecção de Conflitos
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Compara o MD5 Hash e Timestamp da versão remota no Drive. Se houver divergência, aciona o algoritmo de 3-Way Merge ou alerta.
                  </p>
                </div>

                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex flex-col gap-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">4</span>
                    Commit & Confirmação
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Arquivo sobrescrito com sucesso na pasta "Meu Aplicativo". Fila atualizada para <code className="text-emerald-400">SYNCED</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Conflict Resolution Matrix */}
            <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Matriz de Resolução de Conflitos (Conflict Resolution Strategy)
              </h3>
              <div className="rounded-xl border border-stone-800 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-stone-900 text-stone-400 text-left">
                    <tr>
                      <th className="p-3 font-semibold">Cenário</th>
                      <th className="p-3 font-semibold">Estado Local</th>
                      <th className="p-3 font-semibold">Estado Nuvem (Drive)</th>
                      <th className="p-3 font-semibold">Ação do Protocolo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 text-stone-300">
                    <tr>
                      <td className="p-3 font-medium text-emerald-400">Edição Unilateral Local</td>
                      <td className="p-3">Modificado (T2 &gt; T1)</td>
                      <td className="p-3">Inalterado (T1)</td>
                      <td className="p-3 text-emerald-300">Fast-Forward Upload automático para o Drive</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-blue-400">Edição Unilateral Remota</td>
                      <td className="p-3">Inalterado (T1)</td>
                      <td className="p-3">Modificado em outro aparelho (T2 &gt; T1)</td>
                      <td className="p-3 text-blue-300">Fast-Forward Download silencioso para o SQLite</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-rose-400">Edição Concorrente Bidirecional</td>
                      <td className="p-3">Modificado offline (T2a)</td>
                      <td className="p-3">Modificado em outro dispositivo (T2b)</td>
                      <td className="p-3 text-amber-300">
                        Cria snapshot de segurança de ambas as versões e solicita escolha do usuário na interface
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-purple-400">Exclusão Concorrente</td>
                      <td className="p-3">Excluído localmente</td>
                      <td className="p-3">Editado na nuvem</td>
                      <td className="p-3 text-purple-300">Preserva na Lixeira e alerta o usuário</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: FORMATO ESTRUTURADO JSON/AST (WORD DOCUMENTS)
           ========================================================================= */}
        {activeTab === 'ast' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                Especificação da Árvore Sintática Abstrata (Document AST v1.0)
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed mb-6">
                Para atender às exigências de paginação sequencial do Microsoft Word, exportação DOCX e formatação de cabeçalhos/rodapés, os documentos tradicionais nunca são armazenados como texto puro, e sim como uma <strong>Árvore Sintática Estruturada (AST)</strong> baseada em nós.
              </p>

              {/* AST Node Types Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-6">
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <span className="font-mono text-emerald-400 font-bold block mb-1">heading</span>
                  <span className="text-stone-400 text-[11px]">Níveis 1 a 6 com alinhamento textual e âncora para sumário.</span>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <span className="font-mono text-blue-400 font-bold block mb-1">paragraph</span>
                  <span className="text-stone-400 text-[11px]">Texto corrido, justificado, recuo de 1.25cm e links [[ ]].</span>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <span className="font-mono text-amber-400 font-bold block mb-1">table</span>
                  <span className="text-stone-400 text-[11px]">Matriz de células, cabeçalhos, bordas e legendas.</span>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <span className="font-mono text-purple-400 font-bold block mb-1">page_break</span>
                  <span className="text-stone-400 text-[11px]">Corta o fluxo e gera uma nova página visual A4/Carta.</span>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <span className="font-mono text-rose-400 font-bold block mb-1">footnote</span>
                  <span className="text-stone-400 text-[11px]">Nota numerada no rodapé da respectiva página.</span>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <span className="font-mono text-cyan-400 font-bold block mb-1">table_of_contents</span>
                  <span className="text-stone-400 text-[11px]">Sumário gerado dinamicamente a partir dos headings.</span>
                </div>
              </div>

              {/* JSON Example Schema */}
              <div className="border border-stone-800 rounded-xl overflow-hidden">
                <div className="bg-stone-900 px-4 py-2 border-b border-stone-800 flex justify-between items-center text-xs text-stone-400">
                  <span className="font-mono">exemplo_documento_ast.json</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            version: '1.0',
                            title: 'Especificação do Sistema',
                            pageConfig: {
                              paperSize: 'A4',
                              orientation: 'portrait',
                              margins: { top: 25, bottom: 25, left: 30, right: 25 },
                              headerText: 'SYNAPSEDOCS V1.0',
                              footerText: 'Confidencial',
                              showPageNumbers: true,
                              pageNumberFormat: 'X_OF_Y',
                            },
                            nodes: [
                              { id: 'h1', type: 'heading', level: 1, text: 'Introdução' },
                              { id: 'p1', type: 'paragraph', text: 'Texto do parágrafo formal.', alignment: 'justify' },
                              { id: 'pb1', type: 'page_break' },
                            ],
                          },
                          null,
                          2
                        ),
                        'ast_json'
                      )
                    }
                    className="hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Exemplo
                  </button>
                </div>
                <pre className="text-xs font-mono text-emerald-400 bg-stone-950 p-4 overflow-x-auto max-h-80">
{`{
  "version": "1.0",
  "title": "Especificação Técnica do Sistema",
  "metadata": {
    "author": "Eduardo M.",
    "createdAt": "2026-11-04T05:00:00.000Z",
    "wordCount": 290
  },
  "pageConfig": {
    "paperSize": "A4",
    "orientation": "portrait",
    "marginPreset": "normal",
    "margins": { "top": 25, "bottom": 25, "left": 30, "right": 25 },
    "headerText": "NODARA — ESPECIFICAÇÃO DE PRODUTO V1.0",
    "footerText": "Confidencial | Nodara",
    "showPageNumbers": true,
    "pageNumberFormat": "X_OF_Y",
    "headerAlignment": "right",
    "footerAlignment": "center"
  },
  "nodes": [
    {
      "id": "node_toc",
      "type": "table_of_contents",
      "title": "Sumário Executivo",
      "maxLevel": 3
    },
    {
      "id": "node_h1",
      "type": "heading",
      "level": 1,
      "text": "1. Visão Geral e Arquitetura do Produto",
      "alignment": "left"
    },
    {
      "id": "node_p1",
      "type": "paragraph",
      "text": "O Nodara é concebido para unir o rigor formal dos processadores de texto tradicionais com o pensamento em rede.",
      "alignment": "justify"
    },
    {
      "id": "node_pb1",
      "type": "page_break"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
