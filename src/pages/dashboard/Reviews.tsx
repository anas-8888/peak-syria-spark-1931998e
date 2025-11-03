import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Star, MessageSquare, ThumbsUp, Eye, CheckCircle, XCircle, Trash2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
type Review = {
  id: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  products: {
    name: string;
  };
};
const Reviews = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const {
    data: reviews = [],
    isLoading
  } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("product_reviews").select(`
          *,
          products:product_id (
            name
          )
        `).order("created_at", {
        ascending: false
      });
      if (error) throw error;

      // Fetch profiles separately
      const reviewsWithProfiles = await Promise.all(data.map(async review => {
        const {
          data: profile
        } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", review.user_id).single();
        return {
          ...review,
          profiles: profile
        };
      }));
      return reviewsWithProfiles as Review[];
    }
  });
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status
    }: {
      id: string;
      status: string;
    }) => {
      const {
        error
      } = await supabase.from("product_reviews").update({
        status
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-reviews"]
      });
      toast.success("Review status updated");
    },
    onError: () => {
      toast.error("Failed to update review status");
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-reviews"]
      });
      toast.success("Review deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete review");
    }
  });
  const filteredReviews = reviews.filter(review => review.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || review.products.name.toLowerCase().includes(searchTerm.toLowerCase()) || review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0"
  };
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />);
  };
  return <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Reviews & Ratings</h1>
        <p className="text-muted-foreground">Manage product reviews and customer feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">4.5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">1,456</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive Reviews</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by customer or product name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map(review => <TableRow key={review.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.profiles?.avatar_url || ""} alt={review.profiles?.full_name || "User"} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{review.profiles?.full_name || "Anonymous"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{review.products.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm truncate">{review.comment}</p>
                  </TableCell>
                  <TableCell>
                    {format(new Date(review.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={review.status === "approved" ? "default" : review.status === "rejected" ? "destructive" : "secondary"}>
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {review.status !== "approved" && <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({
                    id: review.id,
                    status: "approved"
                  })} disabled={updateStatusMutation.isPending} title="Approve">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>}
                      {review.status !== "rejected" && <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({
                    id: review.id,
                    status: "rejected"
                  })} disabled={updateStatusMutation.isPending} title="Reject">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>}
                      {review.status !== "pending" && <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({
                    id: review.id,
                    status: "pending"
                  })} disabled={updateStatusMutation.isPending} title="Set to Pending">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </Button>}
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(review.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Reviews;