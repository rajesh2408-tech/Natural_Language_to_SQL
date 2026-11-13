import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import QueryInput from './components/QueryInput';
import SqlViewer from './components/SqlViewer';
import ResultsTable from './components/ResultsTable';
import SchemaExplorer from './components/SchemaExplorer';
import QueryHistory from './components/QueryHistory';
import CachingModal from './components/CachingModal';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [originalGeneratedSql, setOriginalGeneratedSql] = useState('');
  const [explanation, setExplanation] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [isMutationDeclined, setIsMutationDeclined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingSql, setIsExecutingSql] = useState(false);

  // Sidebars and Modals
  const [showSchema, setShowSchema] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showCachingModal, setShowCachingModal] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [isReseeding, setIsReseeding] = useState(false);

  // Session History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('nl2sql_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nl2sql_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  // Load Schema on mount
  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/schema');
      if (res.ok) {
        const data = await res.json();
        setSchemaInfo(data);
      }
    } catch (err) {
      console.error('Error fetching schema:', err);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  // Full Natural Language to SQL Execution
  const handleQuery = async (queryText) => {
    setIsLoading(true);
    setError(null);
    setIsMutationDeclined(false);
    setQueryResult(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to process query.');
        setIsMutationDeclined(Boolean(data.is_mutation_declined));
        setGeneratedSql(data.sql || '');
        setOriginalGeneratedSql(data.sql || '');
        setExplanation(data.explanation || '');
        setAssumptions(data.assumptions || '');
        setModelUsed(data.model_used || '');
        setQueryResult(data);

        // Record failed attempt in history too
        const historyItem = {
          id: 'hist_' + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          prompt: queryText,
          sql: data.sql || '',
          result: data,
          explanation: data.explanation,
          assumptions: data.assumptions,
          modelUsed: data.model_used,
        };
        setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
        setActiveHistoryId(historyItem.id);
        return;
      }

      setGeneratedSql(data.sql || '');
      setOriginalGeneratedSql(data.sql || '');
      setExplanation(data.explanation || '');
      setAssumptions(data.assumptions || '');
      setModelUsed(data.model_used || '');
      setQueryResult(data);

      // Add to session history
      const historyItem = {
        id: 'hist_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        prompt: queryText,
        sql: data.sql,
        result: data,
        explanation: data.explanation,
        assumptions: data.assumptions,
        modelUsed: data.model_used,
      };

      setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
      setActiveHistoryId(historyItem.id);

    } catch (err) {
      setError(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Modified/Custom SQL (Bonus Feature)
  const handleExecuteEditedSql = async (customSql) => {
    setIsExecutingSql(true);
    setError(null);
    setIsMutationDeclined(false);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: customSql, prompt }),
      });

      const data = await res.json();
      setGeneratedSql(customSql);

      if (!data.success) {
        setError(data.error);
        setIsMutationDeclined(Boolean(data.is_mutation_declined));
      }

      setQueryResult(data);

      // Add modified query to history
      const historyItem = {
        id: 'hist_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        prompt: `${prompt || 'Custom Query'} (Edited SQL)`,
        sql: customSql,
        result: data,
        explanation: 'Custom edited SQL query executed manually.',
        assumptions: '',
        modelUsed: 'manual-edit',
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
      setActiveHistoryId(historyItem.id);

    } catch (err) {
      setError(err.message || 'Failed to execute edited SQL query.');
    } finally {
      setIsExecutingSql(false);
    }
  };

  // Restore previous query from session history (Part 5)
  const handleSelectHistoryItem = (item) => {
    setActiveHistoryId(item.id);
    setPrompt(item.prompt.replace(' (Edited SQL)', ''));
    setGeneratedSql(item.sql);
    setOriginalGeneratedSql(item.sql);
    setExplanation(item.explanation || '');
    setAssumptions(item.assumptions || '');
    setModelUsed(item.modelUsed || '');
    setQueryResult(item.result);
    setError(item.result?.success ? null : item.result?.error);
    setIsMutationDeclined(Boolean(item.result?.is_mutation_declined));
  };

  // Reseed Database
  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      const res = await fetch('/api/db/reseed', { method: 'POST' });
      if (res.ok) {
        await fetchSchema();
        setQueryResult(null);
        setGeneratedSql('');
        setPrompt('');
      }
    } catch (err) {
      console.error('Failed to reseed database:', err);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onToggleSchema={() => setShowSchema(!showSchema)}
        showSchema={showSchema}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
        onOpenCachingModal={() => setShowCachingModal(true)}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        historyCount={history.length}
        schemaInfo={schemaInfo}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schema Explorer Sidebar (Bonus Feature) */}
        <SchemaExplorer
          isOpen={showSchema}
          onClose={() => setShowSchema(false)}
          schemaInfo={schemaInfo}
          onInsertText={(text) => setPrompt(p => p ? `${p} ${text}` : text)}
        />

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-6 w-full">
          {/* Part 1: Natural Language Input */}
          <QueryInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleQuery}
            isLoading={isLoading}
            error={error}
            setError={setError}
          />

          {/* Part 2: Generated SQL & Bonus: Editable SQL */}
          <SqlViewer
            sql={generatedSql}
            originalGeneratedSql={originalGeneratedSql}
            explanation={explanation}
            assumptions={assumptions}
            modelUsed={modelUsed}
            onExecuteSql={handleExecuteEditedSql}
            isExecuting={isExecutingSql}
          />

          {/* Part 3 & 4: Live Query Execution & Dynamic Results Table */}
          <ResultsTable
            result={queryResult}
            error={error}
            isExecuting={isLoading || isExecutingSql}
            isMutationDeclined={isMutationDeclined}
          />
        </main>

        {/* Part 5: Query History Sidebar */}
        <QueryHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={history}
          onSelectHistoryItem={handleSelectHistoryItem}
          onClearHistory={() => {
            setHistory([]);
            localStorage.removeItem('nl2sql_history');
          }}
          activeHistoryId={activeHistoryId}
        />
      </div>

      {/* Speed & Caching Strategy Modal (Bonus Feature) */}
      <CachingModal
        isOpen={showCachingModal}
        onClose={() => setShowCachingModal(false)}
      />
    </div>
  );
}
