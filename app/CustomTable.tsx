"use client";

import { useState, useRef, useEffect } from "react";

interface Column {
  key: string;
  label: string;
}

interface RowData {
  [key: string]: string | number;
}

interface CustomTableProps {
  columns: Column[];
  initialData?: RowData[];
}

export default function CustomTable({
  columns,
  initialData = [],
}: CustomTableProps) {
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
      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(spanRef.current);
      range.collapse(false); // false = collapse to end
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

  const moveToNextCell = (rowIndex: number, columnKey: string) => {
    const currentColIndex = columns.findIndex((col) => col.key === columnKey);

    if (currentColIndex < columns.length - 1) {
      const nextCol = columns[currentColIndex + 1];
      setEditingCell({ rowIndex, columnKey: nextCol.key });
      setEditValue(String(data[rowIndex][nextCol.key] || ""));
    } else if (rowIndex < data.length - 1) {
      const nextCol = columns[0];
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
    columns.forEach((col) => {
      newRow[col.key] = "";
    });
    setData([...data, newRow]);
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b-2 border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {columns.map((column) => (
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
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <button
          onClick={addNewRow}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          + Add New Row
        </button>
      </div>
    </div>
  );
}
