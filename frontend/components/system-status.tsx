import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export function SystemStatus() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">System Status</CardTitle>
        <CheckCircle className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">Operational</div>
        <p className="text-xs text-muted-foreground">All systems running smoothly</p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>API Response Time</span>
            <span className="font-medium">45ms</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Uptime (30 days)</span>
            <span className="font-medium">99.99%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

