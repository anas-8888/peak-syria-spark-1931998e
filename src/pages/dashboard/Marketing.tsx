import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Mail, MessageSquare, Bell, Share2, Edit, Trash2, Play, Pause, BarChart3, Users, Target, FileText, TrendingUp, MousePointerClick, DollarSign, Send } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { Skeleton } from "@/components/ui/skeleton";

type Campaign = {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  subject: string | null;
  content: string;
  template_id: string | null;
  target_segment: string | null;
  target_audience_size: number;
  scheduled_date: string | null;
  created_at: string;
};

type CampaignAnalytics = {
  id: string;
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  converted_count: number;
  revenue_generated: number;
  bounce_count: number;
  unsubscribe_count: number;
};

type Template = {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject: string | null;
  content: string;
  preview_text: string | null;
  created_at: string;
};

type Segment = {
  id: string;
  name: string;
  description: string | null;
  criteria: any;
  customer_count: number;
  created_at: string;
};

const Marketing = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deletingSegmentId, setDeletingSegmentId] = useState<string | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "email" as Campaign['type'],
    template_id: "",
    target_segment: "",
    scheduled_date: ""
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "email" as Template['type'],
    subject: "",
    content: "",
    preview_text: ""
  });

  const [segmentForm, setSegmentForm] = useState({
    name: "",
    description: "",
    minPurchaseAmount: "",
    maxPurchaseAmount: "",
    minOrders: "",
    maxOrders: "",
    location: "",
    lastPurchaseDays: ""
  });

  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Fetch campaign analytics
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ["campaign-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_analytics")
        .select("*");
      if (error) throw error;
      return data as CampaignAnalytics[];
    },
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["marketing-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });

  // Fetch segments
  const { data: segments = [], isLoading: segmentsLoading } = useQuery({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_segments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Segment[];
    },
  });
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Create/Update Campaign
  const saveCampaignMutation = useMutation({
    mutationFn: async (data: typeof campaignForm & { id?: string }) => {
      // Get template details
      const template = templates.find(t => t.id === data.template_id);
      if (!template) {
        throw new Error(t("Please select a template"));
      }

      if (data.id) {
        const { error } = await supabase
          .from("marketing_campaigns")
          .update({
            name: data.name,
            type: data.type,
            template_id: data.template_id,
            subject: template.subject || null,
            content: template.content,
            target_segment: data.target_segment || null,
            scheduled_date: data.scheduled_date || null,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marketing_campaigns")
          .insert({
            name: data.name,
            type: data.type,
            template_id: data.template_id,
            subject: template.subject || null,
            content: template.content,
            target_segment: data.target_segment || null,
            scheduled_date: data.scheduled_date || null,
            status: 'draft'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      toast.success(editingCampaign ? t("Campaign updated") : t("Campaign created"));
      setIsCampaignDialogOpen(false);
      resetCampaignForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to save campaign"));
    },
  });

  // Delete Campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      toast.success(t("Campaign deleted"));
      setDeletingCampaignId(null);
    },
    onError: () => {
      toast.error(t("Failed to delete campaign"));
    },
  });

  // Save Template
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("marketing_templates")
          .update({
            name: data.name,
            type: data.type,
            subject: data.subject || null,
            content: data.content,
            preview_text: data.preview_text || null,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marketing_templates")
          .insert({
            name: data.name,
            type: data.type,
            subject: data.subject || null,
            content: data.content,
            preview_text: data.preview_text || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-templates"] });
      toast.success(editingTemplate ? t("Template updated") : t("Template created"));
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: () => {
      toast.error(t("Failed to save template"));
    },
  });

  // Delete Template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-templates"] });
      toast.success(t("Template deleted"));
      setDeletingTemplateId(null);
    },
    onError: () => {
      toast.error(t("Failed to delete template"));
    },
  });

  // Save Segment
  const saveSegmentMutation = useMutation({
    mutationFn: async (data: typeof segmentForm & { id?: string }) => {
      // Build criteria object from form fields
      const criteria: any = {};
      if (data.minPurchaseAmount) criteria.minPurchaseAmount = parseFloat(data.minPurchaseAmount);
      if (data.maxPurchaseAmount) criteria.maxPurchaseAmount = parseFloat(data.maxPurchaseAmount);
      if (data.minOrders) criteria.minOrders = parseInt(data.minOrders);
      if (data.maxOrders) criteria.maxOrders = parseInt(data.maxOrders);
      if (data.location) criteria.location = data.location;
      if (data.lastPurchaseDays) criteria.lastPurchaseDays = parseInt(data.lastPurchaseDays);

      if (data.id) {
        const { error } = await supabase
          .from("customer_segments")
          .update({
            name: data.name,
            description: data.description || null,
            criteria: criteria,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_segments")
          .insert({
            name: data.name,
            description: data.description || null,
            criteria: criteria,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      toast.success(editingSegment ? t("Segment updated") : t("Segment created"));
      setIsSegmentDialogOpen(false);
      resetSegmentForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to save segment"));
    },
  });

  // Delete Segment
  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_segments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
      toast.success(t("Segment deleted"));
      setDeletingSegmentId(null);
    },
    onError: () => {
      toast.error(t("Failed to delete segment"));
    },
  });

  // Update Campaign Status
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign['status'] }) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      toast.success(t("Campaign status updated"));
    },
    onError: () => {
      toast.error(t("Failed to update campaign status"));
    },
  });

  const resetCampaignForm = () => {
    setCampaignForm({
      name: "",
      type: "email",
      template_id: "",
      target_segment: "",
      scheduled_date: ""
    });
    setEditingCampaign(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      type: "email",
      subject: "",
      content: "",
      preview_text: ""
    });
    setEditingTemplate(null);
  };

  const resetSegmentForm = () => {
    setSegmentForm({
      name: "",
      description: "",
      minPurchaseAmount: "",
      maxPurchaseAmount: "",
      minOrders: "",
      maxOrders: "",
      location: "",
      lastPurchaseDays: ""
    });
    setEditingSegment(null);
  };

  const openEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      type: campaign.type,
      template_id: campaign.template_id || "",
      target_segment: campaign.target_segment || "",
      scheduled_date: campaign.scheduled_date ? campaign.scheduled_date.slice(0, 16) : ""
    });
    setIsCampaignDialogOpen(true);
  };

  const openEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      subject: template.subject || "",
      content: template.content,
      preview_text: template.preview_text || ""
    });
    setIsTemplateDialogOpen(true);
  };

  const openEditSegment = (segment: Segment) => {
    setEditingSegment(segment);
    const criteria = segment.criteria || {};
    setSegmentForm({
      name: segment.name,
      description: segment.description || "",
      minPurchaseAmount: criteria.minPurchaseAmount?.toString() || "",
      maxPurchaseAmount: criteria.maxPurchaseAmount?.toString() || "",
      minOrders: criteria.minOrders?.toString() || "",
      maxOrders: criteria.maxOrders?.toString() || "",
      location: criteria.location || "",
      lastPurchaseDays: criteria.lastPurchaseDays?.toString() || ""
    });
    setIsSegmentDialogOpen(true);
  };

  const getCampaignIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], any> = {
      draft: "secondary",
      scheduled: "outline",
      active: "default",
      paused: "secondary",
      completed: "secondary",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  // Calculate overview metrics
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = analytics.reduce((sum, a) => sum + a.sent_count, 0);
  const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.revenue_generated), 0);
  const avgOpenRate = analytics.length > 0
    ? (analytics.reduce((sum, a) => sum + (a.sent_count > 0 ? (a.opened_count / a.sent_count) * 100 : 0), 0) / analytics.length)
    : 0;
  const avgClickRate = analytics.length > 0
    ? (analytics.reduce((sum, a) => sum + (a.opened_count > 0 ? (a.clicked_count / a.opened_count) * 100 : 0), 0) / analytics.length)
    : 0;

  const isLoading = campaignsLoading || analyticsLoading || templatesLoading || segmentsLoading;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("Marketing & Campaigns")}</h1>
          <p className="text-muted-foreground">{t("Manage your marketing campaigns and customer engagement")}</p>
        </div>
        {activeTab === "overview" && (
          <Button onClick={() => {
            resetCampaignForm();
            setIsCampaignDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("Create Campaign")}
          </Button>
        )}
        {activeTab === "templates" && (
          <Button onClick={() => {
            resetTemplateForm();
            setIsTemplateDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("Create Template")}
          </Button>
        )}
        {activeTab === "segments" && (
          <Button onClick={() => {
            resetSegmentForm();
            setIsSegmentDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("Create Segment")}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
          <TabsTrigger value="templates">{t("Templates")}</TabsTrigger>
          <TabsTrigger value="segments">{t("Segments")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("Total Campaigns")}</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{totalCampaigns}</div>
                    <p className="text-xs text-muted-foreground">{activeCampaigns} {t("active")}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("Messages Sent")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{t("All campaigns")}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("Avg. Open Rate")}</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">{t("Click rate")}: {avgClickRate.toFixed(1)}%</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("Revenue Generated")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">{t("From campaigns")}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "overview" && t("Recent Campaigns")}
                {activeTab === "templates" && t("Recent Templates")}
                {activeTab === "segments" && t("Recent Segments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === "overview" && (
                campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("No campaigns yet. Create your first campaign to get started!")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Campaign")}</TableHead>
                        <TableHead>{t("Type")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                        <TableHead>{t("Schedule / Timer")}</TableHead>
                        <TableHead>{t("Sent")}</TableHead>
                        <TableHead>{t("Opens")}</TableHead>
                        <TableHead>{t("Clicks")}</TableHead>
                        <TableHead className="text-right">{t("Actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.slice(0, 5).map((campaign) => {
                        const campaignAnalytics = analytics.find(a => a.campaign_id === campaign.id);
                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getCampaignIcon(campaign.type)}
                                <span className="capitalize">{campaign.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                            <TableCell>
                              {campaign.scheduled_date && campaign.status === 'scheduled' ? (
                                <CountdownTimer targetDate={campaign.scheduled_date} />
                              ) : campaign.scheduled_date ? (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(campaign.scheduled_date).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">{t("Not scheduled")}</span>
                              )}
                            </TableCell>
                            <TableCell>{campaignAnalytics?.sent_count || 0}</TableCell>
                            <TableCell>{campaignAnalytics?.opened_count || 0}</TableCell>
                            <TableCell>{campaignAnalytics?.clicked_count || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditCampaign(campaign)}
                                  title={t("Edit campaign")}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {campaign.status === 'draft' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'scheduled' })}
                                      title={t("Schedule campaign")}
                                    >
                                      <Pause className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                                      title={t("Send now")}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                
                                {campaign.status === 'scheduled' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                                      title={t("Send now")}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                                      title={t("Pause campaign")}
                                    >
                                      <Pause className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                
                                {campaign.status === 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                                    title={t("Pause campaign")}
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {campaign.status === 'paused' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                                    title={t("Resume campaign")}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingCampaignId(campaign.id)}
                                  title={t("Delete campaign")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )
              )}

              {activeTab === "templates" && (
                isLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32 mb-2" />
                          <Skeleton className="h-5 w-20" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("No templates yet. Create your first template to get started!")}</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.slice(0, 6).map((template) => (
                      <Card key={template.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <Badge variant="outline" className="mt-2">
                                <FileText className="h-3 w-3 mr-1" />
                                {template.type}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {template.subject && (
                            <p className="text-sm font-medium mb-2">{t("Subject")}: {template.subject}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}

              {activeTab === "segments" && (
                isLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : segments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("No segments yet. Create your first segment to get started!")}</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.slice(0, 6).map((segment) => (
                      <Card key={segment.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{segment.name}</CardTitle>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{segment.customer_count} {t("customers")}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{segment.description || t("No description")}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{t("Campaigns")}</h2>
              <p className="text-muted-foreground">{t("Create and manage marketing campaigns")}</p>
            </div>
            <Button onClick={() => {
              resetCampaignForm();
              setIsCampaignDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t("Create Campaign")}
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("No campaigns yet")}</h3>
                <p className="text-muted-foreground mb-4">{t("Get started by creating your first marketing campaign")}</p>
                <Button onClick={() => {
                  resetCampaignForm();
                  setIsCampaignDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Create Campaign")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => {
                const campaignAnalytics = analytics.find(a => a.campaign_id === campaign.id);
                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getCampaignIcon(campaign.type)}
                            <CardTitle>{campaign.name}</CardTitle>
                            {getStatusBadge(campaign.status)}
                          </div>
                          {campaign.subject && (
                            <p className="text-sm text-muted-foreground">{t("Subject")}: {campaign.subject}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {campaign.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {campaign.status === 'active' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditCampaign(campaign)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeletingCampaignId(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t("Sent")}</p>
                          <p className="font-semibold">{campaignAnalytics?.sent_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("Opened")}</p>
                          <p className="font-semibold">{campaignAnalytics?.opened_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("Clicked")}</p>
                          <p className="font-semibold">{campaignAnalytics?.clicked_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("Conversions")}</p>
                          <p className="font-semibold">{campaignAnalytics?.converted_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("Revenue")}</p>
                          <p className="font-semibold">{formatPrice(Number(campaignAnalytics?.revenue_generated || 0))}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Recent Templates")}</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t("No templates yet. Create your first template to get started!")}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.slice(0, 6).map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="outline" className="mt-2">
                              <FileText className="h-3 w-3 mr-1" />
                              {template.type}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingTemplateId(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {template.subject && (
                          <p className="text-sm font-medium mb-2">{t("Subject")}: {template.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Recent Segments")}</CardTitle>
            </CardHeader>
            <CardContent>
              {segments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t("No segments yet. Create your first segment to get started!")}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segments.slice(0, 6).map((segment) => (
                    <Card key={segment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{segment.name}</CardTitle>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{segment.customer_count} {t("customers")}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditSegment(segment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingSegmentId(segment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{segment.description || t("No description")}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? t("Edit Campaign") : t("Create Campaign")}</DialogTitle>
            <DialogDescription>{editingCampaign ? t("Update campaign details") : t("Create a new marketing campaign")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">{t("Campaign Name")} *</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder={t("Summer Sale Email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-type">{t("Type")} *</Label>
              <Select
                value={campaignForm.type}
                onValueChange={(value: Campaign['type']) => {
                  // Reset template_id when type changes
                  setCampaignForm({ ...campaignForm, type: value, template_id: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="email">{t("Email")}</SelectItem>
                  <SelectItem value="sms">{t("SMS")}</SelectItem>
                  <SelectItem value="push">{t("Push Notification")}</SelectItem>
                  <SelectItem value="social">{t("Social Media")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-template">{t("Select Template")} *</Label>
              <Select
                value={campaignForm.template_id}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, template_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Choose a template")}>
                    {campaignForm.template_id && templates.find(t => t.id === campaignForm.template_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {templates
                    .filter(t => t.type === campaignForm.type)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {templates.filter(t => t.type === campaignForm.type).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("No")} {campaignForm.type} {t("templates available. Create one first.")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-segment">{t("Target Segment")}</Label>
              <Select
                value={campaignForm.target_segment}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, target_segment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("All customers")} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">{t("All Customers")}</SelectItem>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-scheduled">{t("Schedule Date (Optional)")}</Label>
              <Input
                id="campaign-scheduled"
                type="datetime-local"
                value={campaignForm.scheduled_date}
                onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={() => saveCampaignMutation.mutate(editingCampaign ? { ...campaignForm, id: editingCampaign.id } : campaignForm)}
              disabled={!campaignForm.name || !campaignForm.template_id}
            >
              {editingCampaign ? t("Update") : t("Create")} {t("Campaign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? t("Edit Template") : t("Create Template")}</DialogTitle>
            <DialogDescription>{editingTemplate ? t("Update template details") : t("Create a new email template")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">{t("Template Name")} *</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder={t("Welcome Email Template")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">{t("Type")} *</Label>
              <Select
                value={templateForm.type}
                onValueChange={(value: Template['type']) => setTemplateForm({ ...templateForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="email">{t("Email")}</SelectItem>
                  <SelectItem value="sms">{t("SMS")}</SelectItem>
                  <SelectItem value="push">{t("Push Notification")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templateForm.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="template-subject">{t("Subject")}</Label>
                <Input
                  id="template-subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder={t("Welcome to our store!")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="template-content">{t("Content")} *</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder={t("Template content...")}
                rows={8}
              />
            </div>

            {templateForm.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="template-preview">{t("Preview Text")}</Label>
                <Input
                  id="template-preview"
                  value={templateForm.preview_text}
                  onChange={(e) => setTemplateForm({ ...templateForm, preview_text: e.target.value })}
                  placeholder={t("Preview text shown in email client...")}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={() => saveTemplateMutation.mutate(editingTemplate ? { ...templateForm, id: editingTemplate.id } : templateForm)}
              disabled={!templateForm.name || !templateForm.content}
            >
              {editingTemplate ? t("Update") : t("Create")} {t("Template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Dialog */}
      <Dialog open={isSegmentDialogOpen} onOpenChange={setIsSegmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSegment ? t("Edit Segment") : t("Create Segment")}</DialogTitle>
            <DialogDescription>{editingSegment ? t("Update segment details") : t("Create a new customer segment")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">{t("Segment Name")} *</Label>
              <Input
                id="segment-name"
                value={segmentForm.name}
                onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                placeholder={t("VIP Customers")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-description">{t("Description")}</Label>
              <Textarea
                id="segment-description"
                value={segmentForm.description}
                onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                placeholder={`${t("Customers who have spent over")} 1000000 ${t("s.p")}...`}
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-4">{t("Segmentation Criteria")}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-purchase">{t("Minimum Purchase Amount")} ({t("s.p")})</Label>
                  <Input
                    id="min-purchase"
                    type="number"
                    value={segmentForm.minPurchaseAmount}
                    onChange={(e) => setSegmentForm({ ...segmentForm, minPurchaseAmount: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-purchase">{t("Maximum Purchase Amount")} ({t("s.p")})</Label>
                  <Input
                    id="max-purchase"
                    type="number"
                    value={segmentForm.maxPurchaseAmount}
                    onChange={(e) => setSegmentForm({ ...segmentForm, maxPurchaseAmount: e.target.value })}
                    placeholder={t("No limit")}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-orders">{t("Minimum Number of Orders")}</Label>
                  <Input
                    id="min-orders"
                    type="number"
                    value={segmentForm.minOrders}
                    onChange={(e) => setSegmentForm({ ...segmentForm, minOrders: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-orders">{t("Maximum Number of Orders")}</Label>
                  <Input
                    id="max-orders"
                    type="number"
                    value={segmentForm.maxOrders}
                    onChange={(e) => setSegmentForm({ ...segmentForm, maxOrders: e.target.value })}
                    placeholder={t("No limit")}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">{t("Location/Region")}</Label>
                  <Select
                    value={segmentForm.location}
                    onValueChange={(value) => setSegmentForm({ ...segmentForm, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select region")} />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">{t("All Regions")}</SelectItem>
                      {regions.map((region: any) => (
                        <SelectItem key={region.id} value={region.name}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-purchase">{t("Last Purchase Within (Days)")}</Label>
                  <Input
                    id="last-purchase"
                    type="number"
                    value={segmentForm.lastPurchaseDays}
                    onChange={(e) => setSegmentForm({ ...segmentForm, lastPurchaseDays: e.target.value })}
                    placeholder={t("e.g., 30")}
                    min="0"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                {t("Fill in the criteria fields to define your customer segment. All fields are optional - only filled fields will be used for segmentation.")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSegmentDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={() => saveSegmentMutation.mutate(editingSegment ? { ...segmentForm, id: editingSegment.id } : segmentForm)}
              disabled={!segmentForm.name}
            >
              {editingSegment ? t("Update") : t("Create")} {t("Segment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <AlertDialog open={!!deletingCampaignId} onOpenChange={() => setDeletingCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Campaign")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this campaign? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingCampaignId && deleteCampaignMutation.mutate(deletingCampaignId)}>
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Template Dialog */}
      <AlertDialog open={!!deletingTemplateId} onOpenChange={() => setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Template")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this template? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTemplateId && deleteTemplateMutation.mutate(deletingTemplateId)}>
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Segment Dialog */}
      <AlertDialog open={!!deletingSegmentId} onOpenChange={() => setDeletingSegmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Segment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this segment? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingSegmentId && deleteSegmentMutation.mutate(deletingSegmentId)}>
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Marketing;
