import { ColumnDef } from "@tanstack/react-table"

export type Campaign = {
  id: string
  name: string
  discount: number
  totalCodes: number
  usedCodes: number
  status: "active" | "inactive"
  createdAt: string
}

export const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: "name",
    header: "Kampanya Adı",
  },
  {
    accessorKey: "discount",
    header: "İndirim Oranı",
    cell: ({ row }) => {
      return <div>%{row.getValue("discount")}</div>
    },
  },
  {
    accessorKey: "totalCodes",
    header: "Toplam Kod",
  },
  {
    accessorKey: "usedCodes",
    header: "Kullanılan Kod",
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status")
      return (
        <div className={`px-2 py-1 rounded-full text-center text-sm ${
          status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {status === "active" ? "Aktif" : "Pasif"}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleDateString("tr-TR")
    },
  },
] 