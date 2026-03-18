"use client";

import { useState } from "react";
import tableData from "../new.json";
import { CustomTable, TableDataApiResponse } from "./CustomTable";

interface RowData {
  id?: number;
  [key: string]: string | number | undefined;
}

export default function Home() {
  const [savedJson, setSavedJson] = useState<Record<string, unknown> | null>(
    null,
  );

  const typedTableData = tableData as TableDataApiResponse;

  const handleSave = (
    data: RowData[],
    tableType: "ist" | "uebersicht",
    invoiceIndex: number,
  ) => {
    // Remove id, Del, # from the data
    const cleanedData = data.map((row) => {
      const cleanRow: Record<string, unknown> = {};
      Object.keys(row).forEach((key) => {
        if (key !== "id" && key !== "Del" && key !== "#") {
          cleanRow[key] = row[key];
        }
      });
      return cleanRow;
    });

    // Get the columns from the cleaned data
    const columns = cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [];

    // Create the response object for only this specific table
    const result = {
      [tableType]: {
        columns,
        rows: cleanedData,
      },
    };

    setSavedJson(result);
    console.log(
      `Saved ${tableType.toUpperCase()} for Invoice ${invoiceIndex + 1}:`,
      result,
    );
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Editable table</h1>

      {/* Loop through all invoice files */}
      {typedTableData.invoice_files.map((invoice, invoiceIndex) => (
        <div key={invoice.id} className="mb-8">
          {invoice.ist && invoice.ist.rows && invoice.ist.rows.length > 0 && (
            <CustomTable
              tableType="ist"
              invoiceIndex={invoiceIndex}
              columns={[
                { key: "Del", label: "" },
                { key: "#", label: "SL" },
                ...invoice.ist.columns.map((col) => ({
                  key: col,
                  label: col,
                })),
              ]}
              initialData={invoice.ist.rows.map((row, index) => ({
                id: index + 1,
                ...row,
              }))}
              onSave={handleSave}
            />
          )}
        </div>
      ))}

      {/* Display saved JSON */}
      {savedJson && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Saved Table Response
            </h2>
            <button
              onClick={() => setSavedJson(null)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          </div>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto max-h-96">
            {JSON.stringify(savedJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
