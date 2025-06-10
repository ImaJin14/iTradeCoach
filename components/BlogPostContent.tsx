"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  Eye,
  Edit,
  Trash2,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  status: string;
  author_id: string;
  category_id: string | null;
  views_count: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  excerpt: string | null;
  featured: boolean;
  featured_image_url: string | null;
  read_time: number | null;
  author?: {
    name: string;
    avatar_url: string | null;
  } | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface BlogPostContentProps {
  slug: string;
}

export default function BlogPostContent({ slug }: BlogPostContentProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Separate function to get user and role efficiently
    async function getCurrentUserWithRole(): Promise<{ user: any | null, role: string }> {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          return { user: null, role: '' };
        }

        // Get role directly from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Error fetching user role:', profileError);
          return { user, role: '' };
        }

        return { user, role: profile?.role || '' };
      } catch (error) {
        console.warn('Error getting current user:', error);
        return { user: null, role: '' };
      }
    }

    // Simplified post fetching
    async function fetchPostBySlug(postSlug: string) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('NOT_FOUND');
        }
        throw new Error(`Failed to fetch post: ${error.message}`);
      }

      return data;
    }

    // Check if user can view the post
    function canViewPost(post: any, user: any, userRole: string): boolean {
      if (post.status === 'published') {
        return true;
      }
      
      if (!user) {
        return false;
      }
      
      return user.id === post.author_id || userRole === 'admin';
    }

    // Fixed author fetching with proper error handling
    async function fetchAuthor(authorId: string) {
      try {
        // First try to get from user_profiles with profiles join
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            prof_id,
            avatar_url
          `)
          .eq('prof_id', authorId)
          .single();

        // Get name from profiles table separately
        const { data: nameData, error: nameError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', authorId)
          .single();

        if (profileError && nameError) {
          return { name: 'Unknown Author', avatar_url: null };
        }

        return {
          name: nameData?.name || 'Unknown Author',
          avatar_url: profileData?.avatar_url || null
        };
      } catch (error) {
        console.warn('Error fetching author:', error);
        return { name: 'Unknown Author', avatar_url: null };
      }
    }

    // Simplified category fetching
    async function fetchCategory(categoryId: string) {
      try {
        const { data, error } = await supabase
          .from('blog_categories')
          .select('name, slug')
          .eq('id', categoryId)
          .single();

        if (error) {
          console.warn('Error fetching category:', error);
          return null;
        }

        return data;
      } catch (error) {
        console.warn('Error fetching category:', error);
        return null;
      }
    }

    // Optimized tags fetching
    async function fetchPostTags(postId: string) {
      try {
        const { data, error } = await supabase
          .from('blog_post_tags')
          .select(`
            blog_tags (
              id,
              name,
              slug
            )
          `)
          .eq('post_id', postId);

        if (error) {
          console.warn('Error fetching tags:', error);
          return [];
        }

        return data?.map(item => item.blog_tags).filter(Boolean) || [];
      } catch (error) {
        console.warn('Error fetching tags:', error);
        return [];
      }
    }

    // Non-blocking view count increment
    async function incrementViewCount(postId: string, currentCount: number) {
      try {
        await supabase
          .from('blog_posts')
          .update({ views_count: currentCount + 1 })
          .eq('id', postId);
      } catch (error) {
        console.warn('Error incrementing view count:', error);
      }
    }

    // Optimized related posts fetching with fixed author handling
    async function fetchRelatedPosts(categoryId: string, currentPostId: string): Promise<BlogPost[]> {
      try {
        const { data: relatedData, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            blog_categories!blog_posts_category_id_fkey (
              name,
              slug
            )
          `)
          .eq('category_id', categoryId)
          .eq('status', 'published')
          .neq('id', currentPostId)
          .limit(3);

        if (error || !relatedData) {
          return [];
        }

        // Transform the data to match your BlogPost interface
        const relatedPosts = await Promise.all(
          relatedData.map(async (post) => {
            // Fetch author and tags for each related post
            const [author, tags] = await Promise.all([
              fetchAuthor(post.author_id),
              fetchPostTags(post.id)
            ]);
            
            return {
              ...post,
              author,
              category: post.blog_categories,
              tags
            } as BlogPost;
          })
        );

        return relatedPosts;
      } catch (error) {
        console.warn('Error fetching related posts:', error);
        return [];
      }
    }

    // Main load function
    async function loadPost() {
      try {
        // Get current user and their role in parallel
        const [userResult, postResult] = await Promise.all([
          getCurrentUserWithRole(),
          fetchPostBySlug(slug)
        ]);

        if (userResult.user) {
          setCurrentUser(userResult.user);
          setUserRole(userResult.role);
        }

        // Check permissions before proceeding
        if (!canViewPost(postResult, userResult.user, userResult.role)) {
          throw new Error('NOT_FOUND');
        }

        // Fetch additional data in parallel
        const [authorData, categoryData, tagsData] = await Promise.all([
          fetchAuthor(postResult.author_id),
          postResult.category_id ? fetchCategory(postResult.category_id) : Promise.resolve(null),
          fetchPostTags(postResult.id)
        ]);

        const fullPost: BlogPost = {
          ...postResult,
          author: authorData,
          category: categoryData,
          tags: tagsData
        };

        setPost(fullPost);

        // Do these operations in parallel but don't wait for them
        Promise.all([
          incrementViewCount(postResult.id, postResult.views_count || 0),
          postResult.category_id ? fetchRelatedPosts(postResult.category_id, postResult.id) : Promise.resolve([])
        ]).then(([, relatedPosts]) => {
          if (relatedPosts.length > 0) {
            setRelatedPosts(relatedPosts);
          }
        }).catch(error => {
          console.warn('Error fetching related content:', error);
        });

      } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
          return notFound();
        }
        
        console.error('Error loading post:', error);
        toast({
          title: "Error",
          description: "Failed to load blog post. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadPost();
    }
  }, [slug, toast]);

  // Helper functions
  const canManagePost = () => {
    return currentUser && post && (userRole === 'admin' || post.author_id === currentUser.id);
  };

  // Simplified delete function with better error handling
  const handleDeletePost = async () => {
    if (!post) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);

      if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }

      toast({
        title: "Post Deleted",
        description: "The blog post has been deleted successfully.",
      });

      router.push('/blog');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || undefined,
          text: post?.excerpt || undefined,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "The post link has been copied to your clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested blog post could not be found.</p>
          <Button asChild>
            <Link href="/blog">Back to Blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4"
          asChild
        >
          <Link href="/blog">
            <ChevronLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>

      <article className="space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.category && (
                <Badge variant="outline">{post.category.name}</Badge>
              )}
              {post.featured && (
                <Badge>Featured</Badge>
              )}
              {post.status === 'draft' && (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {canManagePost() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/blog/edit/${post.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Post
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDeletePost}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                />
                <AvatarFallback>{post.author?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{post.author?.name || 'Unknown Author'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.published_at 
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
              }
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.read_time || 0} min read
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views_count || 0} views
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        {post.author && (
          <div className="pt-6 border-t">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                />
                <AvatarFallback className="text-xl">{post.author.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{post.author.name || 'Unknown Author'}</h3>
                <p className="text-muted-foreground">
                  Trading expert and educator sharing insights to help traders succeed in the markets.
                </p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="pt-12 border-t">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Card key={relatedPost.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{relatedPost.category?.name}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {relatedPost.read_time || 0} min
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2">{relatedPost.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {relatedPost.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage 
                          src={relatedPost.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${relatedPost.author_id}`} 
                        />
                        <AvatarFallback className="text-xs">{relatedPost.author?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span>{relatedPost.author?.name || 'Unknown Author'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {relatedPost.published_at 
                        ? new Date(relatedPost.published_at).toLocaleDateString()
                        : new Date(relatedPost.created_at).toLocaleDateString()
                      }
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/blog/${relatedPost.slug}`}>
                      Read More
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}