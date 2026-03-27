/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableSchema {
  columns: string[];
  rows: Array<Record<string, any>>;
}

export interface TableDataApiResponse {
  table_data: Record<string, TableSchema>;
}

interface Column {
  key: string;
  label: string;
  pinned?: boolean;
}

interface RowData {
  id?: number;
  [key: string]: string | number | undefined;
}

interface CustomTableProps {
  columns: Column[];
  initialData?: RowData[];
  title?: string;
  tableType: string;
  onSave?: (data: RowData[], tableType: string) => void;
  isReadOnly?: boolean;
  footerRight?: ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLTIP_STORAGE_KEY = "table_scroll_tooltip_dismissed";
const TOOLTIP_DURATION_DAYS = 30;

// ─── Inline SVG icons (no external icon library needed) ───────────────────────

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PinIcon({ pinned }: { pinned: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={pinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L9 9H3l5.5 4-2 7L12 16l5.5 4-2-7L21 9h-6z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Simple debounce (no lodash needed) ───────────────────────────────────────

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomTable({
  columns,
  initialData = [],
  tableType,
  onSave,
  isReadOnly = false,
  footerRight,
}: CustomTableProps) {
  const [data, setData] = useState<RowData[]>(initialData);
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(
    new Set(columns.filter((col) => col.pinned).map((col) => col.key)),
  );
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnKey: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const spanRef = useRef<HTMLSpanElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTooltip, setShowScrollTooltip] = useState(false);

  // Check if tooltip should be shown
  useEffect(() => {
    const dismissedData = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (!dismissedData) {
      setShowScrollTooltip(true);
    } else {
      const { dismissedAt } = JSON.parse(dismissedData);
      const daysSinceDismissed = Math.floor(
        (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceDismissed >= TOOLTIP_DURATION_DAYS) {
        setShowScrollTooltip(true);
        localStorage.removeItem(TOOLTIP_STORAGE_KEY);
      }
    }
  }, []);

  const handleDismissTooltip = () => {
    localStorage.setItem(
      TOOLTIP_STORAGE_KEY,
      JSON.stringify({ dismissedAt: new Date().toISOString() }),
    );
    setShowScrollTooltip(false);
  };


  // Calculate column widths based on content
  const calculateWidths = () => {
    const widths: Record<string, number> = {};
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return widths;
    context.font = "14px sans-serif";

    columns.forEach((column) => {
      if (column.key === "Del") {
        widths[column.key] = 48;
        return;
      }
      if (column.key === "#") {
        widths[column.key] = 64;
        return;
      }

      let maxWidth = context.measureText(column.label).width + 60;
      data.forEach((row) => {
        const textWidth =
          context.measureText(String(row[column.key] || "")).width + 24 + 2;
        maxWidth = Math.max(maxWidth, textWidth);
      });
      widths[column.key] = maxWidth;
    });
    return widths;
  };

  const applyWidths = () => {
    const container = tableContainerRef.current;
    if (!container) return;
    const rawWidths = calculateWidths();
    const fixedKeys = new Set(["#", "Del"]);
    const totalFixed = Object.entries(rawWidths)
      .filter(([k]) => fixedKeys.has(k))
      .reduce((sum, [, w]) => sum + w, 0);
    const contentEntries = Object.entries(rawWidths).filter(
      ([k]) => !fixedKeys.has(k),
    );
    const totalContent = contentEntries.reduce((sum, [, w]) => sum + w, 0);
    const available = container.clientWidth - totalFixed;
    if (totalContent > 0 && totalContent < available) {
      const scale = available / totalContent;
      const scaled: Record<string, number> = { ...rawWidths };
      contentEntries.forEach(([key, w]) => {
        scaled[key] = w * scale;
      });
      setColumnWidths(scaled);
    } else {
      setColumnWidths(rawWidths);
    }
  };

  useEffect(() => {
    const t = setTimeout(applyWidths, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => applyWidths());
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns]);

  // Expand column width while typing (only grow, never shrink below scaled width)
  useEffect(() => {
    if (editingCell && editValue) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;
      context.font = "14px sans-serif";
      const textWidth = context.measureText(editValue).width + 24 + 2;
      const t = setTimeout(
        () =>
          setColumnWidths((prev) => ({
            ...prev,
            [editingCell.columnKey]: Math.max(
              prev[editingCell.columnKey] || 0,
              textWidth,
            ),
          })),
        0,
      );
      return () => clearTimeout(t);
    }
  }, [editValue, editingCell]);

  // Auto-focus cursor at end when entering edit mode
  useEffect(() => {
    if (editingCell && spanRef.current) {
      spanRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(spanRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [editingCell]);

  const debouncedSave = useRef(
    debounce((callback: () => void) => callback(), 10),
  ).current;

  const saveCell = () => {
    if (editingCell && !isReadOnly) {
      const newData = [...data];
      newData[editingCell.rowIndex][editingCell.columnKey] = editValue;
      setData(newData);
      debouncedSave(() => onSave?.(newData, tableType));
    }
  };

  const handleCellClick = (
    rowIndex: number,
    columnKey: string,
    currentValue: string | number,
  ) => {
    if (isReadOnly) return;
    setEditingCell({ rowIndex, columnKey });
    setEditValue(String(currentValue));
  };

  const handleCellBlur = () => {
    if (!isReadOnly) saveCell();
    setEditingCell(null);
  };

  const editableColumns = columns.filter(
    (col) => col.key !== "#" && col.key !== "Del",
  );

  const moveToNextCell = (rowIndex: number, columnKey: string) => {
    if (isReadOnly) return;
    const idx = editableColumns.findIndex((col) => col.key === columnKey);
    if (idx < editableColumns.length - 1) {
      const next = editableColumns[idx + 1];
      setEditingCell({ rowIndex, columnKey: next.key });
      setEditValue(String(data[rowIndex][next.key] || ""));
    } else if (rowIndex < data.length - 1) {
      const next = editableColumns[0];
      setEditingCell({ rowIndex: rowIndex + 1, columnKey: next.key });
      setEditValue(String(data[rowIndex + 1][next.key] || ""));
    } else {
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell || isReadOnly) return;
    if (e.key === "Tab") {
      e.preventDefault();
      saveCell();
      moveToNextCell(editingCell.rowIndex, editingCell.columnKey);
    } else if (e.key === "Enter") {
      saveCell();
      setEditingCell(null);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const addNewRow = () => {
    if (isReadOnly) return;
    const newRow: RowData = {};
    const maxId =
      data.length > 0 ? Math.max(...data.map((row) => row.id || 0)) : 0;
    newRow.id = maxId + 1;
    editableColumns.forEach((col) => {
      newRow[col.key] = "";
    });
    setData([...data, newRow]);
    setTimeout(() => {
      tableContainerRef.current?.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const deleteRow = (rowIndex: number) => {
    if (isReadOnly) return;
    const newData = data.filter((_, i) => i !== rowIndex);
    setData(newData);
    setEditingCell(null);
    onSave?.(newData, tableType);
  };

  const togglePinColumn = (columnKey: string) => {
    if (columnKey === "Del" || columnKey === "#") return;
    setPinnedColumns((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(columnKey) ? next.delete(columnKey) : next.add(columnKey);
      return next;
    });
  };

  const isPinned = (columnKey: string) =>
    columnKey === "Del" || columnKey === "#" || pinnedColumns.has(columnKey);

  // Reorder: Del, #, pinned content columns, unpinned content columns
  // This ensures pinned columns are always in the visible left group
  const orderedColumns = [
    ...columns.filter((col) => col.key === "Del"),
    ...columns.filter((col) => col.key === "#"),
    ...columns.filter(
      (col) =>
        col.key !== "Del" && col.key !== "#" && pinnedColumns.has(col.key),
    ),
    ...columns.filter(
      (col) =>
        col.key !== "Del" && col.key !== "#" && !pinnedColumns.has(col.key),
    ),
  ];

  const getColumnStyle = (
    columnKey: string,
    columnIndex: number,
  ): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: columnWidths[columnKey] || 200,
    };
    if (!isPinned(columnKey)) return baseStyle;

    let leftPosition = 0;
    for (let i = 0; i < columnIndex; i++) {
      if (isPinned(orderedColumns[i].key))
        leftPosition += columnWidths[orderedColumns[i].key] || 200;
    }
    return {
      ...baseStyle,
      position: "sticky",
      left: `${leftPosition}px`,
      zIndex: 10,
      boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
    };
  };

  const getHeaderStyle = (columnKey: string, columnIndex: number) => {
    const base = getColumnStyle(columnKey, columnIndex);
    return isPinned(columnKey) ? { ...base, zIndex: 30 } : base;
  };

  return (
    <div
      className="mb-8 flex flex-col"
      style={{ height: "calc(88vh - 200px)" }}
    >
      <div className="flex-1 flex flex-col overflow-hidden rounded-lg rounded-t-none border-2 border-gray-200">
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ minWidth: "100%" }}
        >
          <table
            className="border-collapse"
            style={{ tableLayout: "fixed", minWidth: "100%" }}
          >
            <thead className="sticky top-0 z-20 bg-white">
              <tr className="bg-linear-to-r from-gray-50 to-gray-100">
                {orderedColumns.map((column, columnIndex) => {
                  const pinned = isPinned(column.key);
                  const canTogglePin =
                    column.key !== "Del" && column.key !== "#";
                  if (column.key === "Del") {
                    return (
                      <th
                        key={column.key}
                        style={getHeaderStyle(column.key, columnIndex)}
                        className="border-b-2 border-r border-gray-200 px-8 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider bg-gray-50"
                      >
                        {column.label}
                      </th>
                    );
                  }
                  if (column.key === "#") {
                    return (
                      <th
                        key={column.key}
                        style={getHeaderStyle(column.key, columnIndex)}
                        className="border-b-2 border-r border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider bg-gray-50"
                      >
                        {column.label}
                      </th>
                    );
                  }
                  return (
                    <th
                      key={column.key}
                      style={getHeaderStyle(column.key, columnIndex)}
                      className={`border-b-2 border-r border-gray-200 px-2 py-0 text-left text-[12px] font-semibold text-gray-700 tracking-wider last:border-r-0 whitespace-normal break-words ${
                        pinned ? "bg-gray-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{column.label}</span>
                        {canTogglePin && (
                          <button
                            onClick={() => togglePinColumn(column.key)}
                            className={`p-1 rounded cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none ${
                              pinned ? "text-blue-600" : "text-gray-400"
                            }`}
                            title={pinned ? "Unpin column" : "Pin column"}
                          >
                            <PinIcon pinned={pinned} />
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {orderedColumns.map((column, columnIndex) => {
                    if (column.key === "Del") {
                      return (
                        <td
                          key={column.key}
                          style={getColumnStyle(column.key, columnIndex)}
                          className="px-2 py-1 text-center border-r border-gray-200 bg-white"
                        >
                          <button
                            onClick={() => !isReadOnly && deleteRow(rowIndex)}
                            disabled={isReadOnly}
                            className={`text-gray-400 p-1.5 rounded transition-colors ${
                              isReadOnly
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:text-red-600 hover:bg-red-50"
                            }`}
                            title={isReadOnly ? "" : "Delete row"}
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      );
                    }
                    if (column.key === "#") {
                      return (
                        <td
                          key={column.key}
                          style={getColumnStyle(column.key, columnIndex)}
                          className="px-0 py-1 text-sm text-gray-600 text-center font-medium border-r border-gray-200 bg-white"
                        >
                          {rowIndex + 1}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={column.key}
                        style={getColumnStyle(column.key, columnIndex)}
                        className={`px-3 py-1 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 whitespace-normal break-words ${
                          isPinned(column.key) ? "bg-gray-100" : "bg-white"
                        } ${isReadOnly ? "" : "cursor-text"}`}
                        onClick={() =>
                          !isReadOnly &&
                          (editingCell?.rowIndex !== rowIndex ||
                            editingCell?.columnKey !== column.key)
                            ? handleCellClick(
                                rowIndex,
                                column.key,
                                row[column.key] || "",
                              )
                            : null
                        }
                      >
                        <span
                          ref={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.columnKey === column.key
                              ? spanRef
                              : null
                          }
                          contentEditable={
                            !isReadOnly &&
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.columnKey === column.key
                          }
                          suppressContentEditableWarning
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          onInput={(e) =>
                            !isReadOnly &&
                            setEditValue(e.currentTarget.textContent || "")
                          }
                          className={`block ${isReadOnly ? "" : "cursor-text"}`}
                          style={{
                            outline: "none",
                            minHeight: "20px",
                            whiteSpace: "nowrap",
                            overflow: "visible",
                            paddingRight: "2px",
                          }}
                        >
                          {editingCell?.rowIndex === rowIndex &&
                          editingCell?.columnKey === column.key
                            ? (row[column.key] ?? "")
                            : (row[column.key] ??
                              (!isReadOnly && (
                                <span className="text-gray-400">
                                  Click to edit
                                </span>
                              )))}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Horizontal scroll hint tooltip — always at bottom of table, above footer */}
        {showScrollTooltip && (
          <div className="flex justify-center py-2 border-t border-gray-100 bg-white">
            <div className="bg-blue-50 shadow-lg rounded-full border border-blue-200 p-2 px-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center">
                  <span className="font-semibold border border-blue-200 bg-white px-2 py-0.5 rounded-full text-blue-700 text-xs sm:text-sm whitespace-nowrap">
                    Hint
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-blue-700">
                    Scroll horizontally to see more columns
                  </p>
                </div>
                <button
                  onClick={handleDismissTooltip}
                  className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors shrink-0"
                  aria-label="Dismiss tooltip"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer bar */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
          {!isReadOnly ? (
            <button
              onClick={addNewRow}
              className="h-10 px-4 text-sm font-semibold flex items-center gap-2 cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              <PlusIcon />
              Add Row
            </button>
          ) : (
            <span />
          )}
          {footerRight ?? <span />}
        </div>
      </div>
    </div>
  );
}
