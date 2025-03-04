"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import apiClient from "@/lib/api-client"

// Dynamic schema will be created based on available types
const baseCredentialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  data: z.record(z.any()).optional(),
})

// Define the dynamic fields for each credential type
const credentialTypeFields: Record<string, Array<{ name: string; label: string; type: string; description?: string; options?: string[] }>> = {
  API_KEY: [
    {
      name: "apiKey",
      label: "API Key",
      type: "password",
      description: "Enter your API key"
    }
  ],
  OAUTH: [
    {
      name: "provider",
      label: "OAuth Provider",
      type: "select",
      options: ["github", "google", "facebook", "custom"],
      description: "Select the OAuth provider"
    },
    {
      name: "clientId",
      label: "Client ID",
      type: "text",
      description: "OAuth client ID"
    },
    {
      name: "clientSecret",
      label: "Client Secret",
      type: "password",
      description: "OAuth client secret"
    },
    {
      name: "scope",
      label: "Scope (Optional)",
      type: "text",
      description: "OAuth scopes (space-separated)"
    },
    // Custom provider fields will be conditionally rendered
  ],
  ETHEREUM_KEY: [
    {
      name: "privateKey",
      label: "Private Key",
      type: "password",
      description: "Ethereum private key (encrypted)"
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      description: "Ethereum address"
    }
  ],
  COOKIE: [
    {
      name: "cookies",
      label: "Cookies",
      type: "textarea",
      description: "JSON formatted cookies object or cookie string"
    }
  ],
  OTHER: [
    {
      name: "data",
      label: "Credential Data",
      type: "text",
      description: "Enter the credential data"
    }
  ]
}

interface CredentialType {
  id: string;
  name: string;
  description: string;
}

interface AddCredentialDialogProps {
  onCredentialAdded?: () => void;
}

export function AddCredentialDialog({ onCredentialAdded }: AddCredentialDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [credentialTypes, setCredentialTypes] = React.useState<CredentialType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = React.useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { token } = useAuth()

  // Create a dynamic schema based on available types
  const credentialFormSchema = React.useMemo(() => {
    const typeEnum = z.enum(
      credentialTypes.length > 0 
        ? (credentialTypes.map(type => type.id) as [string, ...string[]]) 
        : ["API_KEY"] // Fallback to API_KEY if no types loaded
    );
    
    return baseCredentialFormSchema.extend({
      type: typeEnum
    });
  }, [credentialTypes]);

  type CredentialFormValues = z.infer<typeof credentialFormSchema>;

  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: {
      name: "",
      type: credentialTypes.length > 0 ? credentialTypes[0]?.id : "API_KEY",
      data: {},
    },
  })

  const credentialType = form.watch("type")

  // Fetch credential types when dialog opens
  React.useEffect(() => {
    if (open && credentialTypes.length === 0) {
      fetchCredentialTypes();
    }
  }, [open, credentialTypes.length]);

  async function fetchCredentialTypes() {
    setIsLoadingTypes(true);
    try {
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await apiClient.get('/credentials/types');
      
      console.log("Credential types response:", response);
      
      // Check the response structure
      if (response.success) {
        // The API returns an array of credential types directly in data
        const formattedTypes = response.data.map((type: any) => ({
          id: type.type,
          name: type.type,
          description: type.description
        }));
        
        setCredentialTypes(formattedTypes);
        
        // Set default value to the first type
        if (formattedTypes.length > 0) {
          form.setValue("type", formattedTypes[0].id);
        }
      } else {
        // Fallback to hardcoded types
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("Error fetching credential types:", error);
      // Fall back to hardcoded types
      setCredentialTypes([
        { id: "API_KEY", name: "API Key", description: "API Key Credential" },
        { id: "OAUTH", name: "OAuth", description: "OAuth Credential" },
        { id: "COOKIE", name: "Cookie", description: "Cookie Credential" },
        { id: "ETHEREUM_KEY", name: "Ethereum Key", description: "Ethereum Key Credential" },
        { id: "OTHER", name: "Other", description: "Other Credential" }
      ]);
    } finally {
      setIsLoadingTypes(false);
    }
  }

  async function onSubmit(data: CredentialFormValues) {
    setIsLoading(true)

    try {
      if (!token) {
        throw new Error("Not authenticated");
      }
      
      const response = await apiClient.post('/credentials', {
        name: data.name,
        type: data.type,
        data: data.data,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create credential");
      }

      toast({
        title: "Success",
        description: "Credential created successfully",
      })

      setOpen(false)
      form.reset()
      onCredentialAdded?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create credential. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // This part helps render fields for the selected credential type
  const renderCredentialFields = () => {
    const selectedType = credentialType;
    
    // Get fields for the selected type, or fallback to OTHER
    const fields = credentialTypeFields[selectedType] || credentialTypeFields.OTHER;
    
    // Check if we need to show custom provider fields
    const showCustomProviderFields = selectedType === 'OAUTH' && form.watch('data.provider') === 'custom';
    
    // Get the redirect URI for OAuth
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
    const redirectUri = `${frontendUrl}/api/oauth/callback`;
    
    // Collect all fields to render
    let fieldsToRender = [...fields];
    
    // Add custom provider fields if needed
    if (showCustomProviderFields) {
      fieldsToRender.push(
        {
          name: "authorizationUrl",
          label: "Authorization URL",
          type: "text",
          description: "The authorization URL for your custom OAuth provider"
        },
        {
          name: "tokenUrl",
          label: "Token URL",
          type: "text", 
          description: "The token URL for your custom OAuth provider"
        }
      );
    }
    
    return (
      <>
        {fieldsToRender.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={`data.${field.name}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={field.label}
                      {...formField}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <Select
                      onValueChange={formField.onChange}
                      defaultValue={formField.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.label}
                      {...formField}
                    />
                  )}
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        
        {/* Show the redirect URI for OAuth credentials */}
        {selectedType === 'OAUTH' && (
          <div className="space-y-2">
            <FormLabel>Callback URI</FormLabel>
            <div className="flex">
              <Input 
                readOnly 
                value={redirectUri} 
                className="flex-1 bg-muted" 
              />
              <Button 
                type="button" 
                variant="outline" 
                className="ml-2"
                onClick={() => {
                  navigator.clipboard.writeText(redirectUri);
                  toast({
                    title: "Copied!",
                    description: "Callback URI copied to clipboard",
                  });
                }}
              >
                Copy
              </Button>
            </div>
            <FormDescription>
              Use this callback URI in your OAuth application settings. The credential proxy will capture the OAuth code automatically.
            </FormDescription>
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Credential
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Credential</DialogTitle>
          <DialogDescription>
            Create a new credential to securely store and manage your access tokens, API keys, and other credentials.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My API Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    disabled={isLoadingTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of credential you want to add" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingTypes ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        credentialTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of credential you want to add
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Render dynamic fields based on the selected credential type */}
            {renderCredentialFields()}
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isLoading || isLoadingTypes}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Credential"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 