"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { 
  PolicyTemplate,
  POLICY_TYPES_DISPLAY
} from "@/lib/types/policy"
import { FormDescription } from "@/components/ui/form"

// Define policy form data interface for better type safety
interface PolicyFormData {
  name: string;
  description: string;
  type: string;
  isEnabled: boolean;
  pattern?: string;
  maxCount?: number;
  startTime?: string;
  endTime?: string;
  pluginId?: string;
  credentialId?: string;
  configuration: Record<string, any>;
  [key: string]: any;
}

interface PolicyCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (policyData: PolicyFormData) => void
  isCreating: boolean
  plugins?: Array<{id: string, name: string}> | null
  credentials?: Array<{id: string, name: string}> | null
  templates?: PolicyTemplate[]
}

export function PolicyCreateDialog({
  open,
  onOpenChange,
  onSave,
  isCreating,
  plugins = [],
  credentials = [],
  templates = []
}: PolicyCreateDialogProps) {
  const [policyType, setPolicyType] = useState<string>("")
  const [formData, setFormData] = useState<PolicyFormData>({
    name: "",
    description: "",
    type: "",
    isEnabled: true,
    pattern: "",
    maxCount: 0,
    startTime: "",
    endTime: "",
    pluginId: "",
    credentialId: "",
    configuration: {}
  })
  const [pluginOpen, setPluginOpen] = useState(false)
  const [credentialOpen, setCredentialOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isPluginsLoading, setIsPluginsLoading] = useState(false)
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false)

  const handleTypeChange = (type: string) => {
    setPolicyType(type)
    setFormData((prev: PolicyFormData) => ({ ...prev, type }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: PolicyFormData) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev: PolicyFormData) => ({ ...prev, isEnabled: checked }))
  }

  const handlePluginSelect = (pluginId: string) => {
    setFormData((prev: PolicyFormData) => ({ ...prev, pluginId }))
    setPluginOpen(false)
  }

  const handleCredentialSelect = (credentialId: string) => {
    setFormData((prev: PolicyFormData) => ({ ...prev, credentialId }))
    setCredentialOpen(false)
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    
    if (template) {
      setPolicyType(template.type)
      // Adapt the template data to our form format
      setFormData({
        ...formData,
        name: template.name,
        description: template.description || "",
        type: template.type,
        // Use template config instead of these specific fields
        configuration: template.configTemplate || {}
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const resetForm = () => {
    setPolicyType("")
    setFormData({
      name: "",
      description: "",
      type: "",
      isEnabled: true,
      pattern: "",
      maxCount: 0,
      startTime: "",
      endTime: "",
      pluginId: "",
      credentialId: "",
      configuration: {}
    })
    setSelectedTemplate("")
  }

  // Reset form when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // Get the array of policy types
  const policyTypeKeys = Object.keys(POLICY_TYPES_DISPLAY).map(index => {
    return POLICY_TYPES_DISPLAY[Number(index)].id;
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Define a new policy to control access to your credentials or plugins
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {templates && templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">Policy Template (Optional)</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template or create from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Templates provide pre-configured policy settings
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter policy name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter a description for this policy"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Policy Type</Label>
                <Select
                  value={policyType}
                  onValueChange={handleTypeChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES_DISPLAY.map((typeInfo) => (
                      <SelectItem key={typeInfo.id} value={typeInfo.id}>
                        {typeInfo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isEnabled" 
                    name="isEnabled"
                    checked={formData.isEnabled}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isEnabled">Policy Active</Label>
                </div>
              </div>
            </div>
            
            {/* Plugin selection (if available) */}
            {policyType === 'PLUGIN' && (
              <div className="space-y-2">
                <Label htmlFor="pluginId">Plugin</Label>
                <Popover open={pluginOpen} onOpenChange={setPluginOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={pluginOpen}
                      className="w-full justify-between"
                    >
                      {formData.pluginId
                        ? (plugins || []).find((plugin) => plugin.id === formData.pluginId)?.name || "Unknown plugin"
                        : "Select plugin..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search plugin..." />
                      <CommandEmpty>No plugin found.</CommandEmpty>
                      <CommandGroup>
                        {!plugins || plugins.length === 0 ? (
                          <CommandItem value="no-plugins" disabled>
                            {isPluginsLoading ? "Loading plugins..." : "No plugins found"}
                          </CommandItem>
                        ) : (
                          plugins.map((plugin) => (
                            <CommandItem
                              key={plugin.id}
                              value={plugin.id}
                              onSelect={(value) => {
                                handlePluginSelect(value);
                                setPluginOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.pluginId === plugin.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {plugin.name}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the plugin this policy will apply to
                </FormDescription>
              </div>
            )}
            
            {/* Credential selection (if available) */}
            {policyType === 'CREDENTIAL' && (
              <div className="space-y-2">
                <Label htmlFor="credentialId">Credential</Label>
                <Popover open={credentialOpen} onOpenChange={setCredentialOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={credentialOpen}
                      className="w-full justify-between"
                    >
                      {formData.credentialId
                        ? (credentials || []).find((credential) => credential.id === formData.credentialId)?.name || "Unknown credential"
                        : "Select credential..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search credential..." />
                      <CommandEmpty>No credential found.</CommandEmpty>
                      <CommandGroup>
                        {!credentials || credentials.length === 0 ? (
                          <CommandItem value="no-credentials" disabled>
                            {isCredentialsLoading ? "Loading credentials..." : "No credentials found"}
                          </CommandItem>
                        ) : (
                          credentials.map((credential) => (
                            <CommandItem
                              key={credential.id}
                              value={credential.id}
                              onSelect={(value) => {
                                handleCredentialSelect(value);
                                setCredentialOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.credentialId === credential.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {credential.name}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the credential this policy will apply to
                </FormDescription>
              </div>
            )}
            
            {/* Specific fields based on policy type */}
            {policyType === 'PATTERN_MATCH' && (
              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Textarea 
                  id="pattern" 
                  name="pattern" 
                  value={formData.pattern}
                  onChange={handleChange}
                  placeholder="Enter pattern for matching"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Pattern used to match against requests
                </p>
              </div>
            )}
            
            {policyType === 'COUNT_BASED' && (
              <div className="space-y-2">
                <Label htmlFor="maxCount">Maximum Count</Label>
                <Input 
                  id="maxCount" 
                  name="maxCount" 
                  type="number"
                  value={formData.maxCount}
                  onChange={handleChange}
                  min="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of times the credential can be accessed
                </p>
              </div>
            )}
            
            {policyType === 'TIME_BASED' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime" 
                    name="startTime" 
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input 
                    id="endTime" 
                    name="endTime" 
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                  Creating...
                </>
              ) : (
                "Create Policy"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 