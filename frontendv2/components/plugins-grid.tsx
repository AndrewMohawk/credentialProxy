import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, Wallet, Database, Lock } from "lucide-react"

export function PluginsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plugins.map((plugin) => (
        <Card key={plugin.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">{plugin.icon}</div>
            </div>
            <CardDescription>{plugin.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>{plugin.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Operations</span>
                <span>{plugin.operations}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Policies</span>
                <span>{plugin.policies}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {plugin.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

const plugins = [
  {
    id: "api-key",
    name: "API Key",
    description: "Manage API key credentials for third-party services",
    version: "1.2.0",
    operations: 8,
    policies: 4,
    tags: ["REST", "HTTP", "Authentication"],
    icon: <Key className="h-5 w-5" />,
  },
  {
    id: "oauth",
    name: "OAuth",
    description: "OAuth 1.0 and 2.0 credential management",
    version: "1.1.5",
    operations: 12,
    policies: 5,
    tags: ["OAuth", "Authentication", "Token"],
    icon: <Lock className="h-5 w-5" />,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    description: "Ethereum private key operations and signing",
    version: "1.0.2",
    operations: 15,
    policies: 6,
    tags: ["Blockchain", "Web3", "Crypto"],
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    id: "database",
    name: "Database",
    description: "Secure database credential management",
    version: "1.3.1",
    operations: 10,
    policies: 4,
    tags: ["SQL", "NoSQL", "Connection"],
    icon: <Database className="h-5 w-5" />,
  },
]

