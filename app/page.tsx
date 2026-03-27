"use client";

import { useRef, useState } from "react";
import tableData from "../new.json";
import { CustomTable, TableDataApiResponse } from "./CustomTable";

interface RowData {
  id?: number;
  [key: string]: string | number | undefined;
}

function validateTableData(data: unknown): data is TableDataApiResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (
    !d.table_data ||
    typeof d.table_data !== "object" ||
    Array.isArray(d.table_data)
  )
    return false;
  const tables = d.table_data as Record<string, unknown>;
  if (Object.keys(tables).length === 0) return false;
  for (const key of Object.keys(tables)) {
    const t = tables[key] as Record<string, unknown>;
    if (!Array.isArray(t.columns) || !Array.isArray(t.rows)) return false;
  }
  return true;
}

const FORMAT_EXAMPLE = `{
  "table_data": {
    "table1": {
      "columns": ["Name", "Email", "Role"],
      "rows": [
        { "Name": "Alice", "Email": "alice@example.com", "Role": "Admin" },
        { "Name": "Bob",   "Email": "bob@example.com",   "Role": "User" }
      ]
    },
    "table2": {
      "columns": ["Product", "Price", "Stock"],
      "rows": [
        { "Product": "Widget A", "Price": 9.99,  "Stock": 100 },
        { "Product": "Widget B", "Price": 14.99, "Stock": 45  }
      ]
    }
  }
}`;

export default function Home() {
  const defaultData = tableData as unknown as TableDataApiResponse;

  const [activeData, setActiveData] =
    useState<TableDataApiResponse>(defaultData);
  const [isCustom, setIsCustom] = useState(false);

  const [loadKey, setLoadKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [savedJson, setSavedJson] = useState<Record<string, unknown> | null>(
    null,
  );
  const [showJson, setShowJson] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLoadJson = () => {
    setError(null);
    if (!inputText.trim()) {
      setError("Please paste your JSON first.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(inputText);
    } catch {
      setError("Invalid JSON — check for syntax errors and try again.");
      return;
    }
    if (!validateTableData(parsed)) {
      setError(
        'Structure mismatch. Expected: { "table_data": { "table1": { "columns": [...], "rows": [...] } } }',
      );
      return;
    }
    setActiveData(parsed);
    setIsCustom(true);
    setSavedJson(null);
    setShowJson(false);
    setLoadKey((k) => k + 1);
  };

  const handleReset = () => {
    setActiveData(defaultData);
    setIsCustom(false);
    setSavedJson(null);
    setShowJson(false);
    setInputText("");
    setError(null);
    setPanelOpen(false);
    setLoadKey((k) => k + 1);
  };

  const handleSave = (data: RowData[], tableType: string) => {
    const cleanedData = data.map((row) => {
      const cleanRow: Record<string, unknown> = {};
      Object.keys(row).forEach((key) => {
        if (key !== "id" && key !== "Del" && key !== "#") {
          cleanRow[key] = row[key];
        }
      });
      return cleanRow;
    });
    const columns = cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [];
    setSavedJson((prev) => ({
      ...prev,
      [tableType]: { columns, rows: cleanedData },
    }));
  };

  const tableEntries = Object.entries(activeData.table_data);

  const getDisplayJson = () => {
    const result: Record<string, unknown> = {};
    tableEntries.forEach(([tableKey, tableSchema]) => {
      if (savedJson && savedJson[tableKey]) {
        result[tableKey] = savedJson[tableKey];
      } else {
        const cleanedRows = tableSchema.rows.map((row) => {
          const cleanRow: Record<string, unknown> = {};
          tableSchema.columns.forEach((col) => {
            cleanRow[col] = row[col];
          });
          return cleanRow;
        });
        result[tableKey] = { columns: tableSchema.columns, rows: cleanedRows };
      }
    });
    return { table_data: result };
  };

  const showJsonButton = (
    <button
      onClick={() => setShowJson((prev) => !prev)}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      {showJson ? "Hide JSON" : "Show Updated JSON"}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Table Editor
          </h1>
          {isCustom && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              Custom JSON
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isCustom && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset to Default
            </button>
          )}
          <a
            href="https://github.com/Taufiqul7756/custom-table"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
          <button
            onClick={() => {
              setPanelOpen((p) => !p);
              setError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Load Your JSON
          </button>
        </div>
      </header>

      {/* ── JSON Input Panel ── */}
      {panelOpen && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Paste Your JSON
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Add as many tables as you need under{" "}
                  <code className="text-gray-700">table_data</code>. Each key
                  becomes a separate editable table.
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 items-stretch">
              {/* Left — textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Your JSON
                </label>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste your JSON here…"
                  className={`flex-1 w-full font-mono text-xs border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 transition-colors ${
                    error
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-200 focus:ring-blue-200"
                  }`}
                  spellCheck={false}
                />
                {error && (
                  <p className="text-xs text-red-600 flex items-start gap-1.5">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-0.5 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleLoadJson}
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Load &amp; Render Tables
                  </button>
                  <button
                    onClick={() => {
                      setInputText("");
                      setError(null);
                    }}
                    className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Right — format reference */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Expected Format
                </label>
                <div className="relative flex-1 flex flex-col">
                  <pre className="flex-1 font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto text-gray-600 leading-relaxed">
                    {FORMAT_EXAMPLE}
                  </pre>
                  <button
                    onClick={() => {
                      setInputText(FORMAT_EXAMPLE);
                      setError(null);
                      textareaRef.current?.focus();
                    }}
                    className="absolute top-2 right-2 px-2 py-1 text-xs bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg cursor-pointer transition-colors"
                  >
                    Use as template
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Add <code className="text-gray-600">table2</code>,{" "}
                  <code className="text-gray-600">table3</code>… and each one
                  renders as a separate editable table. Every table needs{" "}
                  <code className="text-gray-600">columns</code> (string array)
                  and <code className="text-gray-600">rows</code> (object
                  array).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="px-8 py-6">
        {/* Source indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-gray-400 font-medium">
            {isCustom
              ? "Showing custom JSON data"
              : "Showing sample data (default.json)"}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-400">
            {tableEntries.length} table{tableEntries.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tables */}
        {tableEntries.map(([tableKey, tableSchema], idx) =>
          tableSchema.rows.length > 0 ? (
            <div key={tableKey} className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {tableKey}
                </span>
              </div>
              <CustomTable
                key={`${tableKey}-${loadKey}`}
                tableType={tableKey}
                columns={[
                  { key: "Del", label: "" },
                  { key: "#", label: "SL" },
                  ...tableSchema.columns.map((col) => ({ key: col, label: col })),
                ]}
                initialData={tableSchema.rows.map((row, index) => ({
                  id: index + 1,
                  ...row,
                }))}
                onSave={handleSave}
                footerRight={idx === tableEntries.length - 1 ? showJsonButton : undefined}
              />
            </div>
          ) : null,
        )}

        {/* JSON output */}
        {showJson && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-500"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">
                  Updated JSON Response
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      JSON.stringify(getDisplayJson(), null, 2),
                    )
                  }
                  className="text-xs px-3 py-1.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowJson(false)}
                  className="text-xs px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <pre className="text-sm font-mono bg-white p-5 overflow-x-auto max-h-96 text-gray-700 leading-relaxed">
              {JSON.stringify(getDisplayJson(), null, 2)}
            </pre>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-4 px-8 flex justify-center items-center">
        <p className="text-sm text-gray-500">
          Made by{" "}
          <a
            href="https://github.com/Taufiqul7756"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:underline inline-flex items-center gap-1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            TaufiqClone
          </a>
        </p>
      </footer>
    </div>
  );
}
