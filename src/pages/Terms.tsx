import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

const Terms = () => {
  const { data: legalPage, isLoading } = useQuery({
    queryKey: ['legal-page', 'terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('page_type', 'terms')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-64 mb-8" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-4" />
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-2 text-foreground">{legalPage?.title}</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Last updated: {legalPage?.last_updated ? new Date(legalPage.last_updated).toLocaleDateString() : 'N/A'}
            </p>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{legalPage?.content || ''}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Terms;
