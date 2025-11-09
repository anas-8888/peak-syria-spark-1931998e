import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const LegalPages = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<'terms' | 'privacy' | 'refund'>('terms');
  const [formData, setFormData] = useState({ title: '', content: '' });

  const { data: legalPages, isLoading } = useQuery({
    queryKey: ['legal-pages-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .order('page_type');
      
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ pageType, title, content }: { pageType: string; title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('legal_pages')
        .update({ 
          title, 
          content, 
          updated_by: user?.id,
          last_updated: new Date().toISOString()
        })
        .eq('page_type', pageType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-pages-admin'] });
      toast.success(t('Legal page updated successfully'));
    },
    onError: (error) => {
      toast.error(t('Failed to update legal page'));
      console.error(error);
    }
  });

  const handlePageChange = (pageType: 'terms' | 'privacy' | 'refund') => {
    setEditingPage(pageType);
    const page = legalPages?.find(p => p.page_type === pageType);
    if (page) {
      setFormData({ title: page.title, content: page.content });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      pageType: editingPage,
      title: formData.title,
      content: formData.content
    });
  };


  const currentPage = legalPages?.find(p => p.page_type === editingPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("Legal Pages")}</h2>
        <p className="text-muted-foreground">
          {t("Manage your Terms of Service, Privacy Policy, and Refund Policy content")}
        </p>
      </div>

      <Tabs value={editingPage} onValueChange={(v) => handlePageChange(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="terms">{t("Terms of Service")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("Privacy Policy")}</TabsTrigger>
          <TabsTrigger value="refund">{t("Refund Policy")}</TabsTrigger>
        </TabsList>

        <TabsContent value={editingPage} className="mt-6">
          <Card>
            <CardHeader>
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </>
              ) : (
                <>
                  <CardTitle>{currentPage?.title}</CardTitle>
                  <CardDescription>
                    {t("Last updated")}: {currentPage?.last_updated ? new Date(currentPage.last_updated).toLocaleString() : t('Never')}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-96 w-full" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t("Page Title")}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t("Enter page title")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">{t("Content (Markdown supported)")}</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={t("Enter page content using Markdown formatting")}
                      className="min-h-[400px] font-mono"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("Use Markdown formatting: ## for headings, **bold**, *italic*, - for lists, etc.")}
                    </p>
                  </div>

                  <Button type="submit" disabled={updateMutation.isPending}>
                    {t("Save Changes")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalPages;
