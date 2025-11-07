import CustomTable from "./CustomTable";

export default function Home() {
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "x", label: "x" },
    { key: "y", label: "y" },
  ];

  const initialData = [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      role: "Developer",
      x: "xxxxxxxxxxxxxxxxx",
      y: "yyyyyyyyyyyyyyyyyy",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "098-765-4321",
      role: "Designer",
      x: "xxxxxxxxxxxxxxxxx",
      y: "yyyyyyyyyyyyyyyyyy",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Editable Table</h1>
      <CustomTable columns={columns} initialData={initialData} />
    </div>
  );
}
