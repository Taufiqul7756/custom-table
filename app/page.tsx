import { CustomTable } from "./CustomTable";

export default function Home() {
  const columns = [
    { key: "Del", label: "" },
    { key: "#", label: "SL" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "address", label: "Address" },
    { key: "address2", label: "Address2" },
  ];

  const initialData = [
    {
      id: 1,
      firstName: "Taufiqul",
      lastName: "Islam",
      email: "taufiqul@example.com",
      phone: "123-456-7890",
      role: "Developer",
      address: "123 Main St",
      address2: "Apt 4B",
    },
    {
      id: 2,
      firstName: "Afatuddin",
      lastName: "Shaon",
      email: "afatuddin@example.com",
      phone: "098-765-4321",
      role: "Designer",
      address: "456 Elm St",
      address2: "Suite 5A",
    },
  ];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Editable Table</h1>
      <CustomTable columns={columns} initialData={initialData} />
    </div>
  );
}
