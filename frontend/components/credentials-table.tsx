"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import apiClient from "@/lib/api-client"

export type Credential = {
  id: string
  name: string
  type: "OAUTH" | "API_KEY" | "ETHEREUM_KEY" | "OTHER"
  data: {
    type: string
    masked: boolean
  }
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export const columns = (onCredentialDeleted?: () => void): ColumnDef<Credential>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant="outline">
          {type.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isEnabled",
    header: "Status",
    cell: ({ row }) => {
      const isEnabled = row.getValue("isEnabled") as boolean
      return (
        <Badge variant={isEnabled ? "default" : "secondary"}>
          {isEnabled ? "Enabled" : "Disabled"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const credential = row.original
      const { toast } = useToast()
      const router = useRouter()

      function navigateToPolicies() {
        router.push(`/policies?credential=${credential.id}`)
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(credential.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={navigateToPolicies}>
              Edit Policies
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const action = credential.isEnabled ? 'disable' : 'enable';
              performCredentialAction(credential.id, action, toast, onCredentialDeleted);
            }}>
              {credential.isEnabled ? "Disable" : "Enable"} Credential
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => deleteCredential(credential.id, credential.name, toast, onCredentialDeleted)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Function to delete a credential
const deleteCredential = async (
  credentialId: string, 
  credentialName: string, 
  toast: any, 
  onCredentialDeleted?: () => void
) => {
  try {
    const response = await apiClient.delete(`/credentials/${credentialId}`);
    
    if (response.success) {
      toast({
        title: "Credential deleted",
        description: `${credentialName} has been deleted successfully.`,
      });
      
      // Refresh the credentials list
      onCredentialDeleted?.();
    } else {
      throw new Error(response.error || "Failed to delete credential");
    }
  } catch (error: any) {
    console.error("Error deleting credential:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to delete credential. Please try again.",
    });
  }
};

// Function to perform credential actions (revoke, etc.)
const performCredentialAction = async (
  credentialId: string, 
  action: string, 
  toast: any, 
  onCredentialDeleted?: () => void
) => {
  try {
    const response = await apiClient.post(`/credentials/${credentialId}/${action}`);
    
    if (response.success) {
      toast({
        title: "Action successful",
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} action completed successfully.`,
      });
      
      // Refresh the credentials list
      onCredentialDeleted?.();
    } else {
      throw new Error(response.error || `Failed to ${action} credential`);
    }
  } catch (error: any) {
    console.error(`Error performing ${action}:`, error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || `Failed to ${action} credential. Please try again.`,
    });
  }
};

interface CredentialsTableProps {
  data: Credential[];
  onCredentialDeleted?: () => void;
}

export function CredentialsTable({ data, onCredentialDeleted }: CredentialsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [actioningId, setActioningId] = React.useState<string | null>(null);
  const { toast } = useToast();
  
  const table = useReactTable({
    data,
    columns: columns(onCredentialDeleted),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter credentials..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="ml-2"
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns(onCredentialDeleted).length}
                  className="h-24 text-center"
                >
                  No credentials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

