"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Policy } from "@/lib/types/policy"
import { formatDate } from "@/lib/utils"
import { Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PolicyTableProps {
  policies: Policy[]
  isLoading?: boolean
  noResultsMessage?: string
  onToggleStatus: (policyId: string, isActive: boolean) => void
  onDelete: (policy: Policy) => void
  onView: (policy: Policy) => void
  onEdit: (policy: Policy) => void
  // Optional columns for plugin/credential tables
  showPlugin?: boolean
  showCredential?: boolean
  plugins?: any[]
  credentials?: any[]
}

export function PoliciesTable({
  policies,
  isLoading = false,
  noResultsMessage = "No policies found",
  onToggleStatus,
  onDelete,
  onView,
  onEdit,
  showPlugin = false,
  showCredential = false,
  plugins = [],
  credentials = []
}: PolicyTableProps) {
  const renderActions = (policy: Policy) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-6 w-6 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onView(policy)}>
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(policy)}>
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Find the related entity name (plugin or credential)
  const getPluginName = (pluginId: string | undefined) => {
    if (!pluginId) return 'N/A';
    if (!plugins || !plugins.length) return pluginId;
    const plugin = plugins.find(p => p.id === pluginId);
    return plugin?.name || pluginId;
  };

  const getCredentialName = (credentialId: string | undefined) => {
    if (!credentialId) return 'N/A';
    if (!credentials || !credentials.length) return credentialId;
    const credential = credentials.find(c => c.id === credentialId);
    return credential?.name || credentialId;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin h-6 w-6 border-3 border-primary rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (!policies.length) {
    return (
      <div className="py-3 text-center text-muted-foreground text-xs">
        {noResultsMessage}
      </div>
    )
  }

  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="py-2 px-2 h-8">Name</TableHead>
          <TableHead className="py-2 px-2 h-8">Type</TableHead>
          {showPlugin && <TableHead className="py-2 px-2 h-8">Plugin</TableHead>}
          {showCredential && <TableHead className="py-2 px-2 h-8">Credential</TableHead>}
          <TableHead className="py-2 px-2 h-8">Description</TableHead>
          <TableHead className="py-2 px-2 h-8">Status</TableHead>
          <TableHead className="py-2 px-2 h-8">Created</TableHead>
          <TableHead className="py-2 px-2 h-8 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <TableRow key={policy.id} className="h-8">
            <TableCell className="font-medium py-1 px-2">{policy.name}</TableCell>
            <TableCell className="py-1 px-2">{policy.type}</TableCell>
            {showPlugin && (
              <TableCell className="max-w-[150px] truncate py-1 px-2">
                {getPluginName(policy.pluginId)}
              </TableCell>
            )}
            {showCredential && (
              <TableCell className="max-w-[150px] truncate py-1 px-2">
                {getCredentialName(policy.credentialId)}
              </TableCell>
            )}
            <TableCell className="max-w-[150px] truncate py-1 px-2">
              <span title={policy.description || "No description"}>
                {policy.description ? policy.description : "No description"}
              </span>
            </TableCell>
            <TableCell className="py-1 px-2">
              <div className="flex items-center gap-1">
                <Switch
                  checked={policy.isActive}
                  onCheckedChange={() => onToggleStatus(policy.id, policy.isActive)}
                  aria-label={policy.isActive ? "Disable policy" : "Enable policy"}
                  className="scale-75 data-[state=checked]:bg-primary"
                />
                <span className="text-xs text-muted-foreground">{policy.isActive ? "Active" : "Inactive"}</span>
              </div>
            </TableCell>
            <TableCell className="py-1 px-2">{formatDate(policy.createdAt)}</TableCell>
            <TableCell className="text-right flex items-center space-x-1 justify-end py-1 px-2">
              {renderActions(policy)}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(policy)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-3 w-3" />
                <span className="sr-only">Delete policy</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 