"use client";

import { useState, useRef, useEffect } from "react";

interface Column {
  key: string;
  label: string;
}

interface RowData {
  id?: number;
  [key: string]: string | number | undefined;
}

interface CustomTableProps {
  columns: Column[];
  initialData?: RowData[];
}

export function CustomTable({ columns, initialData = [] }: CustomTableProps) {
  const [data, setData] = useState<RowData[]>(initialData);
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnKey: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const spanRef = useRef<HTMLSpanElement>(null);

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

  const handleCellClick = (
    rowIndex: number,
    columnKey: string,
    currentValue: string | number
  ) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(String(currentValue));
  };

  const saveCell = () => {
    if (editingCell) {
      const newData = [...data];
      newData[editingCell.rowIndex][editingCell.columnKey] = editValue;
      setData(newData);
    }
  };

  const handleCellBlur = () => {
    saveCell();
    setEditingCell(null);
  };

  const editableColumns = columns.filter(
    (col) => col.key !== "#" && col.key !== "Del"
  );

  const moveToNextCell = (rowIndex: number, columnKey: string) => {
    const currentColIndex = editableColumns.findIndex(
      (col) => col.key === columnKey
    );

    if (currentColIndex < editableColumns.length - 1) {
      const nextCol = editableColumns[currentColIndex + 1];
      setEditingCell({ rowIndex, columnKey: nextCol.key });
      setEditValue(String(data[rowIndex][nextCol.key] || ""));
    } else if (rowIndex < data.length - 1) {
      const nextCol = editableColumns[0];
      setEditingCell({ rowIndex: rowIndex + 1, columnKey: nextCol.key });
      setEditValue(String(data[rowIndex + 1][nextCol.key] || ""));
    } else {
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

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
    const newRow: RowData = {};
    const maxId =
      data.length > 0 ? Math.max(...data.map((row) => row.id || 0)) : 0;
    newRow.id = maxId + 1;

    editableColumns.forEach((col) => {
      newRow[col.key] = "";
    });
    setData([...data, newRow]);
  };

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    setData(newData);
    setEditingCell(null);
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            {columns.map((column) => {
              if (column.key === "Del") {
                return (
                  <th
                    key={column.key}
                    className="border-b-2 border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider w-16"
                  >
                    {column.label}
                  </th>
                );
              }
              if (column.key === "#") {
                return (
                  <th
                    key={column.key}
                    className="border-b-2 border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider w-16"
                  >
                    {column.label}
                  </th>
                );
              }
              return (
                <th
                  key={column.key}
                  className="border-b-2 border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider"
                >
                  {column.label}
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
              {columns.map((column) => {
                if (column.key === "Del") {
                  return (
                    <td key={column.key} className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                        title="Delete row"
                      >
                        <svg
                          width="24"
                          height="24"
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
                      </button>
                    </td>
                  );
                }
                if (column.key === "#") {
                  return (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-600 text-center font-medium"
                    >
                      {row.id || rowIndex + 1}
                    </td>
                  );
                }
                return (
                  <td
                    key={column.key}
                    className="px-6 py-3 text-sm text-gray-900"
                    style={{ width: "200px", maxWidth: "200px" }}
                    onClick={() =>
                      editingCell?.rowIndex !== rowIndex ||
                      editingCell?.columnKey !== column.key
                        ? handleCellClick(
                            rowIndex,
                            column.key,
                            row[column.key] || ""
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
                        editingCell?.rowIndex === rowIndex &&
                        editingCell?.columnKey === column.key
                      }
                      suppressContentEditableWarning
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      onInput={(e) =>
                        setEditValue(e.currentTarget.textContent || "")
                      }
                      className="cursor-text block"
                      style={{
                        outline: "none",
                        minHeight: "20px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {editingCell?.rowIndex === rowIndex &&
                      editingCell?.columnKey === column.key
                        ? row[column.key] || ""
                        : row[column.key] || (
                            <span className="text-gray-400">Click to edit</span>
                          )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <button
          onClick={addNewRow}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}
