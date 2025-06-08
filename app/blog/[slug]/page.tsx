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
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  author_id: string;
  category_id: string | null;
  status: string;
  featured: boolean;
  read_time: number;
  views_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: {
    name: string;
    avatar_url: string | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadPost() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setCurrentUser(user);
          
          // Get user profile for role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUserRole(profile.role);
          }
        }

        await fetchPost();
      } catch (error: any) {
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

    loadPost();
  }, [params.slug, toast]);

  async function fetchPost() {
    try {
      // Fetch the blog post
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:author_id (
            name,
            avatar_url
          ),
          category:category_id (
            name,
            slug
          )
        `)
        .eq('slug', params.slug)
        .single();

      if (postError) {
        if (postError.code === 'PGRST116') {
          notFound();
        }
        throw postError;
      }

      // Check if user can view this post
      if (postData.status !== 'published' && 
          (!currentUser || (currentUser.id !== postData.author_id && userRole !== 'admin'))) {
        notFound();
      }

      // Fetch tags for the post
      const { data: tagData } = await supabase
        .from('blog_post_tags')
        .select(`
          tag:tag_id (
            id,
            name,
            slug
          )
        `)
        .eq('post_id', postData.id);

      const postWithTags = {
        ...postData,
        tags: tagData?.map(t => t.tag) || []
      };

      setPost(postWithTags);

      // Increment view count
      await supabase
        .from('blog_posts')
        .update({ views_count: postData.views_count + 1 })
        .eq('id', postData.id);

      // Fetch related posts
      if (postData.category_id) {
        const { data: relatedData } = await supabase
          .from('blog_posts')
          .select(`
            *,
            author:author_id (
              name,
              avatar_url
            ),
            category:category_id (
              name,
              slug
            )
          `)
          .eq('category_id', postData.category_id)
          .eq('status', 'published')
          .neq('id', postData.id)
          .limit(3);

        if (relatedData) {
          const relatedWithTags = await Promise.all(
            relatedData.map(async (relatedPost) => {
              const { data: relatedTagData } = await supabase
                .from('blog_post_tags')
                .select(`
                  tag:tag_id (
                    id,
                    name,
                    slug
                  )
                `)
                .eq('post_id', relatedPost.id);

              return {
                ...relatedPost,
                tags: relatedTagData?.map(t => t.tag) || []
              };
            })
          );

          setRelatedPosts(relatedWithTags);
        }
      }
    } catch (error: any) {
      console.error('Error fetching post:', error);
      notFound();
    }
  }

  async function handleDeletePost() {
    if (!post) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "The blog post has been deleted successfully.",
      });

      router.push('/blog');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  }

  const canManagePost = () => {
    return currentUser && post && (userRole === 'admin' || post.author_id === currentUser.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
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
    notFound();
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
                  src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{post.author.name}</span>
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
              {post.read_time} min read
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views_count} views
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
        {post.tags.length > 0 && (
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
        <div className="pt-6 border-t">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
              />
              <AvatarFallback className="text-xl">{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{post.author.name}</h3>
              <p className="text-muted-foreground">
                Trading expert and educator sharing insights to help traders succeed in the markets.
              </p>
            </div>
          </div>
        </div>
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
                      {relatedPost.read_time} min
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
                          src={relatedPost.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${relatedPost.author_id}`} 
                        />
                        <AvatarFallback className="text-xs">{relatedPost.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{relatedPost.author.name}</span>
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