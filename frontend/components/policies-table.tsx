'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Policy = {
  id: string
  name: string
  type: 'ALLOW_LIST' | 'DENY_LIST' | 'RATE_LIMIT' | 'TIME_WINDOW' | 'APPROVAL_REQUIRED'
  credentialType: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'inactive' | 'draft'
}

const data: Policy[] = [
  {
    id: 'pol_1',
    name: 'Production API Access',
    type: 'ALLOW_LIST',
    credentialType: 'API Key',
    createdAt: '2023-01-15',
    updatedAt: '2023-06-20',
    status: 'active',
  },
  {
    id: 'pol_2',
    name: 'OAuth Rate Limiting',
    type: 'RATE_LIMIT',
    credentialType: 'OAuth',
    createdAt: '2023-02-10',
    updatedAt: '2023-07-19',
    status: 'active',
  },
  {
    id: 'pol_3',
    name: 'Ethereum Transaction Approval',
    type: 'APPROVAL_REQUIRED',
    credentialType: 'Ethereum',
    createdAt: '2023-03-05',
    updatedAt: '2023-07-21',
    status: 'active',
  },
  {
    id: 'pol_4',
    name: 'Database Access Hours',
    type: 'TIME_WINDOW',
    credentialType: 'Database',
    createdAt: '2022-11-20',
    updatedAt: '2023-06-30',
    status: 'active',
  },
  {
    id: 'pol_5',
    name: 'Blocked Operations',
    type: 'DENY_LIST',
    credentialType: 'API Key',
    createdAt: '2023-04-12',
    updatedAt: '2023-07-18',
    status: 'active',
  },
  {
    id: 'pol_6',
    name: 'Test Environment Limits',
    type: 'RATE_LIMIT',
    credentialType: 'API Key',
    createdAt: '2023-01-30',
    updatedAt: '2023-05-15',
    status: 'inactive',
  },
  {
    id: 'pol_7',
    name: 'New Security Policy',
    type: 'ALLOW_LIST',
    credentialType: 'OAuth',
    createdAt: '2023-07-15',
    updatedAt: '2023-07-15',
    status: 'draft',
  },
];

export const columns: ColumnDef<Policy>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('type')}</Badge>,
  },
  {
    accessorKey: 'credentialType',
    header: 'Credential Type',
    cell: ({ row }) => <div>{row.getValue('credentialType')}</div>,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => <div>{row.getValue('updatedAt')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const policy = row.original;

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(policy.id)}>Copy policy ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit policy</DropdownMenuItem>
            <DropdownMenuItem>View affected credentials</DropdownMenuItem>
            <DropdownMenuItem>View audit logs</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{policy.status === 'active' ? 'Disable' : 'Enable'} policy</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function PoliciesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="pl-8"
          />
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
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No policies found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}

