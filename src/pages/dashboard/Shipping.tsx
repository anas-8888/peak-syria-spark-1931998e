import { Truck, MapPin, DollarSign, Clock, Plus } from "lucide-react";
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

const carriers = [
  {
    id: 1,
    name: "Express Delivery",
    type: "Express",
    coverage: "All Syria",
    deliveryTime: "1-2 days",
    cost: "150,000 SYP",
    activeShipments: 45,
    status: "Active",
  },
  {
    id: 2,
    name: "Standard Shipping",
    type: "Standard",
    coverage: "All Syria",
    deliveryTime: "3-5 days",
    cost: "75,000 SYP",
    activeShipments: 128,
    status: "Active",
  },
  {
    id: 3,
    name: "Economy Shipping",
    type: "Economy",
    coverage: "Major Cities",
    deliveryTime: "5-7 days",
    cost: "50,000 SYP",
    activeShipments: 64,
    status: "Active",
  },
  {
    id: 4,
    name: "Premium Express",
    type: "Premium",
    coverage: "Damascus Only",
    deliveryTime: "Same Day",
    cost: "250,000 SYP",
    activeShipments: 12,
    status: "Active",
  },
];

const zones = [
  { name: "Damascus", baseCost: "50,000 SYP", expressAvailable: true },
  { name: "Aleppo", baseCost: "75,000 SYP", expressAvailable: true },
  { name: "Homs", baseCost: "60,000 SYP", expressAvailable: true },
  { name: "Latakia", baseCost: "80,000 SYP", expressAvailable: false },
  { name: "Hama", baseCost: "65,000 SYP", expressAvailable: false },
];

const Shipping = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shipping Management</h1>
          <p className="text-muted-foreground">Manage carriers, rates, and delivery zones</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Carrier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Shipments</p>
                <p className="text-2xl font-bold">249</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Zones</p>
                <p className="text-2xl font-bold">14</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipping Revenue</p>
                <p className="text-2xl font-bold">18.5M SYP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
                <p className="text-2xl font-bold">3.2 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carriers */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Delivery Time</TableHead>
                <TableHead>Base Cost</TableHead>
                <TableHead>Active Shipments</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carriers.map((carrier) => (
                <TableRow key={carrier.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{carrier.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{carrier.type}</Badge>
                  </TableCell>
                  <TableCell>{carrier.coverage}</TableCell>
                  <TableCell>{carrier.deliveryTime}</TableCell>
                  <TableCell className="font-semibold">{carrier.cost}</TableCell>
                  <TableCell>{carrier.activeShipments}</TableCell>
                  <TableCell>
                    <Badge variant="default">{carrier.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Zones & Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{zone.name}</p>
                        <p className="text-sm text-muted-foreground">Base Cost: {zone.baseCost}</p>
                      </div>
                    </div>
                    {zone.expressAvailable && (
                      <Badge variant="secondary" className="gap-1">
                        <Truck className="h-3 w-3" />
                        Express
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shipping;
