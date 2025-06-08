"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ChevronLeft, 
  Save, 
  Eye, 
  Upload,
  X,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const blogPostSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  excerpt: z.string().min(20, { message: "Excerpt must be at least 20 characters" }),
  content: z.string().min(50, { message: "Content must be at least 50 characters" }),
  category_id: z.string().min(1, { message: "Please select a category" }),
  featured_image_url: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).optional(),
});

type BlogPostValues = z.infer<typeof blogPostSchema>;

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export default function CreateBlogPostPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [availableTags, setAvailableTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BlogPostValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category_id: "",
      featured_image_url: "",
      featured: false,
      status: "draft",
      tags: [],
    },
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        setCurrentUser(user);
        await Promise.all([
          fetchCategories(),
          fetchTags()
        ]);
      } catch (error: any) {
        console.error('Error checking access:', error);
        router.push('/blog');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

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

  async function fetchTags() {
    try {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
    }
  }

  async function createTag(name: string) {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const { data, error } = await supabase
        .from('blog_tags')
        .insert({ name, slug })
        .select()
        .single();

      if (error) throw error;
      
      setAvailableTags(prev => [...prev, data]);
      return data.id;
    } catch (error: any) {
      console.error('Error creating tag:', error);
      return null;
    }
  }

  async function handleAddTag() {
    if (!newTag.trim()) return;

    // Check if tag already exists
    const existingTag = availableTags.find(tag => 
      tag.name.toLowerCase() === newTag.toLowerCase()
    );

    if (existingTag) {
      if (!selectedTags.includes(existingTag.id)) {
        setSelectedTags(prev => [...prev, existingTag.id]);
      }
    } else {
      // Create new tag
      const tagId = await createTag(newTag);
      if (tagId) {
        setSelectedTags(prev => [...prev, tagId]);
      }
    }

    setNewTag("");
  }

  async function onSubmit(data: BlogPostValues) {
    if (!currentUser) return;

    setSaving(true);
    try {
      // Create the blog post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .insert({
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category_id: data.category_id,
          featured_image_url: data.featured_image_url || null,
          featured: data.featured,
          status: data.status,
          author_id: currentUser.id,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add tags if any selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          post_id: post.id,
          tag_id: tagId
        }));

        const { error: tagsError } = await supabase
          .from('blog_post_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({
        title: "Post Created",
        description: `Your blog post has been ${data.status === 'published' ? 'published' : 'saved as draft'} successfully.`,
      });

      router.push('/blog');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create blog post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const getSelectedTagNames = () => {
    return selectedTags.map(tagId => {
      const tag = availableTags.find(t => t.id === tagId);
      return tag?.name || '';
    }).filter(Boolean);
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
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create New Blog Post</h1>
            <p className="text-muted-foreground">Share your insights with the trading community</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>
      </div>

      {previewMode ? (
        // Preview Mode
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{form.watch('title') || 'Blog Post Title'}</CardTitle>
                <CardDescription className="mt-2">
                  {form.watch('excerpt') || 'Blog post excerpt will appear here...'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {form.watch('featured') && (
                  <Badge>Featured</Badge>
                )}
                <Badge variant="outline">
                  {form.watch('status') === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">
                {form.watch('content') || 'Blog post content will appear here...'}
              </div>
            </div>
            {getSelectedTagNames().length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedTagNames().map((tagName) => (
                    <Badge key={tagName} variant="outline">
                      {tagName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Edit Mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your blog post title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excerpt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write a brief excerpt that summarizes your post..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This will be shown in the blog listing and search results
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write your blog post content here..."
                              className="min-h-[400px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Write your full blog post content. You can use markdown formatting.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Featured Post</FormLabel>
                            <FormDescription>
                              Featured posts appear prominently on the blog homepage
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featured_image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional image URL for the post thumbnail
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTag}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {selectedTags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Selected Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tagId) => {
                            const tag = availableTags.find(t => t.id === tagId);
                            return tag ? (
                              <Badge key={tagId} variant="secondary" className="gap-1">
                                {tag.name}
                                <button
                                  type="button"
                                  onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium mb-2">Available Tags</h4>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {availableTags
                          .filter(tag => !selectedTags.includes(tag.id))
                          .map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary"
                              onClick={() => setSelectedTags(prev => [...prev, tag.id])}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/blog')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {form.watch('status') === 'published' ? 'Publish Post' : 'Save Draft'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}