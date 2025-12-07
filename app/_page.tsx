// // Import JSON data

// "use client";

// import { useState } from "react";
// import tableData from "../table.json";
// import { CustomTable } from "./CustomTable";

// interface RowData {
//   id?: number;
//   [key: string]: string | number | undefined;
// }

// export default function Home() {
//   const [savedJson, setSavedJson] = useState<Record<string, unknown> | null>(
//     null
//   );

//   const handleSave = (data: RowData[], title: string) => {
//     const columns = Object.keys(data[0] || {}).filter(
//       (key) => key !== "id" && key !== "Del" && key !== "#"
//     );
//     const rows = data.map((row) => {
//       const newRow: Record<string, unknown> = {};
//       columns.forEach((col) => {
//         newRow[col] = row[col];
//       });
//       return newRow;
//     });

//     const result = {
//       [title]: {
//         columns,
//         rows,
//       },
//     };

//     setSavedJson(result);
//     console.log("Saved JSON:", result);
//   };

//   return (
//     <div className="p-8 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800">Editable Tables</h1>
//       {/* Invoice Details */}
//       <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
//         <h2 className="text-lg font-semibold text-gray-700 mb-2">
//           Invoice Details
//         </h2>
//         <div className="grid grid-cols-2 gap-4 text-sm">
//           <div>
//             <span className="font-medium">RV:</span> {tableData.meta.RV}
//           </div>
//           <div>
//             <span className="font-medium">Invoice Date:</span>{" "}
//             {tableData.meta["Invoice Date"]}
//           </div>
//           <div>
//             <span className="font-medium">Kundennummer:</span>{" "}
//             {tableData.meta.Kundennummer}
//           </div>
//           <div>
//             <span className="font-medium">Firmenname:</span>{" "}
//             {tableData.meta["RE/Firmenname"]}
//           </div>
//         </div>
//       </div>

//       {/* Dynamically render all sheets */}
//       {Object.entries(tableData.sheets).map(([sheetName, sheetData]) => {
//         // Skip empty sheets or sheets without required properties
//         if (
//           !sheetData ||
//           typeof sheetData !== "object" ||
//           !("columns" in sheetData) ||
//           !("rows" in sheetData) ||
//           !sheetData.columns ||
//           !sheetData.rows ||
//           sheetData.rows.length === 0
//         ) {
//           return null;
//         }

//         // Now TypeScript knows sheetData has columns and rows
//         const columns = [
//           { key: "Del", label: "" },
//           { key: "#", label: "SL" },
//           ...(sheetData.columns as string[]).map((col: string) => ({
//             key: col,
//             label: col,
//           })),
//         ];

//         const initialData = (sheetData.rows as Record<string, unknown>[]).map(
//           (row: Record<string, unknown>, index: number) => ({
//             id: index + 1,
//             ...row,
//           })
//         );

//         return (
//           <CustomTable
//             key={sheetName}
//             title={sheetName}
//             columns={columns}
//             initialData={initialData}
//             onSave={handleSave}
//           />
//         );
//       })}
//       {/* Display saved JSON */}
//       {savedJson && (
//         <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
//           <h2 className="text-lg font-semibold text-gray-700 mb-2">
//             Saved JSON
//           </h2>
//           <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
//             {JSON.stringify(savedJson, null, 2)}
//           </pre>
//         </div>
//       )}
//     </div>
//   );
// }
