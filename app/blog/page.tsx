"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, ArrowRight, Search, Tag, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
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

        await Promise.all([
          fetchPosts(),
          fetchCategories()
        ]);
      } catch (error: any) {
        console.error('Error loading blog data:', error);
        toast({
          title: "Error",
          description: "Failed to load blog data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [toast]);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedCategory]);

  async function fetchPosts() {
    try {
      let query = supabase
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
        `);

      // If user is not authenticated or not admin, only show published posts
      if (!currentUser || userRole !== 'admin') {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch tags for each post
      const postsWithTags = await Promise.all(
        (data || []).map(async (post) => {
          const { data: tagData } = await supabase
            .from('blog_post_tags')
            .select(`
              tag:tag_id (
                id,
                name,
                slug
              )
            `)
            .eq('post_id', post.id);

          return {
            ...post,
            tags: tagData?.map(t => t.tag) || []
          };
        })
      );

      setPosts(postsWithTags);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  }

  const filterPosts = () => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(post => post.category?.slug === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPosts(filtered);
  };

  async function handleDeletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "The blog post has been deleted successfully.",
      });

      await fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  }

  const canManagePost = (post: BlogPost) => {
    return currentUser && (userRole === 'admin' || post.author_id === currentUser.id);
  };

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  if (loading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center space-y-4 flex-1">
          <h1 className="text-4xl font-bold">Trading Insights & Education</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert insights, trading strategies, and educational content to help you succeed in the markets
          </p>
        </div>
        {currentUser && (
          <Button asChild className="gap-2">
            <Link href="/blog/create">
              <Plus className="h-4 w-4" />
              Write Post
            </Link>
          </Button>
        )}
      </div>

      {/* User Posts Management */}
      {currentUser && (
        <Tabs defaultValue="published" className="space-y-6">
          <TabsList>
            <TabsTrigger value="published">Published Posts</TabsTrigger>
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="all-posts">All Posts (Admin)</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="published">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="space-y-6 mb-12">
                <h2 className="text-2xl font-bold">Featured Articles</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        {post.featured_image_url ? (
                          <img 
                            src={post.featured_image_url} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-6">
                            <Badge className="mb-2">{post.category?.name}</Badge>
                            <h3 className="text-lg font-semibold line-clamp-2">{post.title}</h3>
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="line-clamp-2 flex-1">{post.title}</CardTitle>
                          {canManagePost(post) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                  <Link href={`/blog/edit/${post.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <CardDescription className="line-clamp-3">
                          {post.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage 
                                  src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                                />
                                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{post.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.read_time} min read
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        <Button className="w-full" asChild>
                          <Link href={`/blog/${post.slug}`}>
                            Read Article <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Regular Posts */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">
                {featuredPosts.length > 0 ? "Latest Articles" : "All Articles"}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{post.category?.name}</Badge>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {post.read_time} min
                          </div>
                          {canManagePost(post) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                  <Link href={`/blog/edit/${post.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage 
                              src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                            />
                            <AvatarFallback className="text-xs">{post.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{post.author.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/blog/${post.slug}`}>
                          Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* No Results */}
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or category filter
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-posts">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Posts</h2>
                <Button asChild className="gap-2">
                  <Link href="/blog/create">
                    <Plus className="h-4 w-4" />
                    New Post
                  </Link>
                </Button>
              </div>
              
              <div className="grid gap-4">
                {posts
                  .filter(post => post.author_id === currentUser?.id)
                  .map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{post.title}</h3>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                              {post.featured && (
                                <Badge variant="outline">Featured</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                              {post.published_at && (
                                <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>
                              )}
                              <span>{post.views_count} views</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/blog/${post.slug}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/blog/edit/${post.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="all-posts">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">All Posts (Admin)</h2>
                
                <div className="grid gap-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{post.title}</h3>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                              {post.featured && (
                                <Badge variant="outline">Featured</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Author: {post.author.name}</span>
                              <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                              {post.published_at && (
                                <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>
                              )}
                              <span>{post.views_count} views</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/blog/${post.slug}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/blog/edit/${post.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Newsletter Signup */}
      <section className="bg-muted/50 py-16 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Get the latest trading insights, market analysis, and educational content delivered to your inbox
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input placeholder="Enter your email" className="flex-1" />
          <Button>Subscribe</Button>
        </div>
      </section>
    </div>
  );
}