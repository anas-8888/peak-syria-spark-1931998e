import { Mail, TrendingUp, Users, Target, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const campaigns = [
  {
    id: 1,
    name: "Summer Sale 2025",
    type: "Email",
    status: "Active",
    sent: 1248,
    opened: 856,
    clicked: 342,
    revenue: "45,600,000 SYP",
    startDate: "2025/01/01",
    endDate: "2025/03/31",
  },
  {
    id: 2,
    name: "New Customer Welcome",
    type: "Email",
    status: "Active",
    sent: 342,
    opened: 289,
    clicked: 156,
    revenue: "12,400,000 SYP",
    startDate: "2025/01/01",
    endDate: "Ongoing",
  },
  {
    id: 3,
    name: "Basketball Collection Launch",
    type: "Social Media",
    status: "Scheduled",
    sent: 0,
    opened: 0,
    clicked: 0,
    revenue: "0 SYP",
    startDate: "2025/02/01",
    endDate: "2025/02/28",
  },
  {
    id: 4,
    name: "Holiday Special Offer",
    type: "Email",
    status: "Completed",
    sent: 2156,
    opened: 1544,
    clicked: 789,
    revenue: "89,200,000 SYP",
    startDate: "2024/12/15",
    endDate: "2024/12/31",
  },
];

const Marketing = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing & Campaigns</h1>
          <p className="text-muted-foreground">Manage promotional campaigns and marketing efforts</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold">3,746</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Click Rate</p>
                <p className="text-2xl font-bold">28.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campaign Revenue</p>
                <p className="text-2xl font-bold">147M SYP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        campaign.status === "Active"
                          ? "default"
                          : campaign.status === "Scheduled"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{campaign.opened.toLocaleString()}</p>
                      {campaign.sent > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{campaign.clicked.toLocaleString()}</p>
                      {campaign.opened > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {((campaign.clicked / campaign.opened) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{campaign.revenue}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{campaign.startDate}</p>
                      <p className="text-muted-foreground">{campaign.endDate}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Welcome Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automated welcome message for new customers
            </p>
            <div className="flex items-center justify-between">
              <Badge>Active</Badge>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abandoned Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Reminder for customers with items in cart
            </p>
            <div className="flex items-center justify-between">
              <Badge>Active</Badge>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sent automatically after order placement
            </p>
            <div className="flex items-center justify-between">
              <Badge>Active</Badge>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Marketing;
