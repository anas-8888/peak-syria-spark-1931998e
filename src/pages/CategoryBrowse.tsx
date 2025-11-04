import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import PercentageLoader from "@/components/PercentageLoader";
import { ArrowRight, ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CategoryBrowse = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Fetch current category details
  const { data: currentCategory, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, parent_id")
        .eq("id", categoryId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch breadcrumb trail
  const { data: breadcrumbs = [] } = useQuery({
    queryKey: ["category-breadcrumbs", categoryId],
    queryFn: async () => {
      const trail: Array<{ id: string; name: string }> = [];
      let currentId = categoryId;

      while (currentId) {
        const { data } = await supabase
          .from("categories")
          .select("id, name, parent_id")
          .eq("id", currentId)
          .single();

        if (data) {
          trail.unshift({ id: data.id, name: data.name });
          currentId = data.parent_id;
        } else {
          break;
        }
      }

      return trail;
    },
    enabled: !!categoryId,
  });

  // Fetch child categories
  const { data: childCategories = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["child-categories", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, image_url")
        .eq("parent_id", categoryId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      // Check which categories have children
      const categoryIds = data?.map(c => c.id) || [];
      const { data: childrenData } = await supabase
        .from("categories")
        .select("parent_id")
        .in("parent_id", categoryIds)
        .eq("is_active", true);

      const categoriesWithChildren = new Set(
        childrenData?.map(c => c.parent_id) || []
      );

      return (data || []).map(category => ({
        ...category,
        hasChildren: categoriesWithChildren.has(category.id),
      }));
    },
  });

  if (categoryLoading || childrenLoading) {
    return <PercentageLoader message="Loading categories..." />;
  }

  // If no children, redirect to products page
  if (childCategories.length === 0 && currentCategory) {
    navigate(`/products?category=${currentCategory.name.toLowerCase()}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PromoBanner />
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{t(crumb.name)}</span>
              ) : (
                <Link
                  to={`/categories/${crumb.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {t(crumb.name)}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {currentCategory ? t(currentCategory.name) : ""}
          </h1>
          {currentCategory?.description && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t(currentCategory.description)}
            </p>
          )}
        </div>

        {/* Child Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {childCategories.map((category, index) => (
            <Link
              key={category.id}
              to={
                category.hasChildren
                  ? `/categories/${category.id}`
                  : `/products?category=${category.name.toLowerCase()}`
              }
              style={{ animationDelay: `${index * 100}ms` }}
              className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in"
            >
              {/* Category Image */}
              {category.image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Category Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {t(category.name)}
                  </h3>
                  {category.hasChildren && (
                    <div className="flex-shrink-0 bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                      {t("Subcategories")}
                    </div>
                  )}
                </div>

                {category.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {t(category.description)}
                  </p>
                )}

                <div className="flex items-center text-primary font-semibold group-hover:gap-3 transition-all">
                  {category.hasChildren ? t("Browse") : t("Shop Now")}
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            to={breadcrumbs.length > 1 ? `/categories/${breadcrumbs[breadcrumbs.length - 2].id}` : "/"}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            {t("Back to")} {breadcrumbs.length > 1 ? t(breadcrumbs[breadcrumbs.length - 2].name) : t("Home")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryBrowse;
