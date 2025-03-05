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
import { ArrowUpDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type AuditLog = {
  id: string
  timestamp: string
  application: string
  credential: string
  credentialType: string
  operation: string
  status: 'approved' | 'denied' | 'pending' | 'error'
  policyApplied: string
}

const data: AuditLog[] = [
  {
    id: 'log_1',
    timestamp: '2023-07-21 14:32:45',
    application: 'Analytics Dashboard',
    credential: 'Production API Key',
    credentialType: 'API Key',
    operation: 'GET /api/data',
    status: 'approved',
    policyApplied: 'Production API Access',
  },
  {
    id: 'log_2',
    timestamp: '2023-07-21 14:30:12',
    application: 'Monitoring Service',
    credential: 'Analytics OAuth',
    credentialType: 'OAuth',
    operation: 'POST /api/metrics',
    status: 'approved',
    policyApplied: 'OAuth Rate Limiting',
  },
  {
    id: 'log_3',
    timestamp: '2023-07-21 14:28:55',
    application: 'External Processor',
    credential: 'Deployment Wallet',
    credentialType: 'Ethereum',
    operation: 'eth_sendTransaction',
    status: 'denied',
    policyApplied: 'Ethereum Transaction Approval',
  },
  {
    id: 'log_4',
    timestamp: '2023-07-21 14:25:33',
    application: 'Data Sync Tool',
    credential: 'Legacy Database',
    credentialType: 'Database',
    operation: 'SELECT * FROM users',
    status: 'pending',
    policyApplied: 'Database Access Hours',
  },
  {
    id: 'log_5',
    timestamp: '2023-07-21 14:22:18',
    application: 'Backup Service',
    credential: 'Production API Key',
    credentialType: 'API Key',
    operation: 'GET /api/backup',
    status: 'approved',
    policyApplied: 'Production API Access',
  },
  {
    id: 'log_6',
    timestamp: '2023-07-21 14:20:05',
    application: 'Test Automation',
    credential: 'Test Environment',
    credentialType: 'API Key',
    operation: 'POST /api/test',
    status: 'error',
    policyApplied: 'Test Environment Limits',
  },
  {
    id: 'log_7',
    timestamp: '2023-07-21 14:18:42',
    application: 'Analytics Dashboard',
    credential: 'Analytics OAuth',
    credentialType: 'OAuth',
    operation: 'GET /api/reports',
    status: 'approved',
    policyApplied: 'OAuth Rate Limiting',
  },
  {
    id: 'log_8',
    timestamp: '2023-07-21 14:15:30',
    application: 'Payment Processor',
    credential: 'Production API Key',
    credentialType: 'API Key',
    operation: 'POST /api/payments',
    status: 'approved',
    policyApplied: 'Production API Access',
  },
  {
    id: 'log_9',
    timestamp: '2023-07-21 14:12:15',
    application: 'External Processor',
    credential: 'Deployment Wallet',
    credentialType: 'Ethereum',
    operation: 'eth_getBalance',
    status: 'approved',
    policyApplied: 'Ethereum Transaction Approval',
  },
  {
    id: 'log_10',
    timestamp: '2023-07-21 14:10:08',
    application: 'Data Sync Tool',
    credential: 'Legacy Database',
    credentialType: 'Database',
    operation: 'INSERT INTO logs',
    status: 'approved',
    policyApplied: 'Database Access Hours',
  },
];

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'timestamp',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue('timestamp')}</div>,
  },
  {
    accessorKey: 'application',
    header: 'Application',
    cell: ({ row }) => <div>{row.getValue('application')}</div>,
  },
  {
    accessorKey: 'credential',
    header: 'Credential',
    cell: ({ row }) => <div>{row.getValue('credential')}</div>,
  },
  {
    accessorKey: 'credentialType',
    header: 'Type',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('credentialType')}</Badge>,
  },
  {
    accessorKey: 'operation',
    header: 'Operation',
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('operation')}</div>,
  },
  {
    accessorKey: 'policyApplied',
    header: 'Policy Applied',
    cell: ({ row }) => <div>{row.getValue('policyApplied')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'approved'
              ? 'default'
              : status === 'denied'
                ? 'destructive'
                : status === 'pending'
                  ? 'outline'
                  : 'secondary'
          }
        >
          {status}
        </Badge>
      );
    },
  },
];

export function AuditLogsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: 'timestamp',
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={(table.getColumn('operation')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('operation')?.setFilterValue(event.target.value)}
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
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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

