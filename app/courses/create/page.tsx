"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ChevronLeft, 
  Upload, 
  Eye, 
  Save, 
  BookOpen,
  Users,
  Clock,
  Tag,
  FileText,
  Image as ImageIcon
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

const courseFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  level: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select a learning level",
  }),
  category: z.string().min(1, { message: "Please select a category" }),
  duration: z.string().min(1, { message: "Please specify duration" }),
  price: z.string().min(1, { message: "Please set a price" }),
  thumbnail: z.string().optional(),
  learning_objectives: z.string().min(10, { message: "Learning objectives must be at least 10 characters" }),
  prerequisites: z.string().optional(),
  tags: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const COURSE_CATEGORIES = [
  "Technical Analysis",
  "Fundamental Analysis", 
  "Risk Management",
  "Trading Psychology",
  "Market Structure",
  "Options Trading",
  "Forex Trading",
  "Cryptocurrency",
  "Portfolio Management",
  "Algorithmic Trading"
];

const LEVEL_DESCRIPTIONS = {
  beginner: "Perfect for those new to trading with basic concepts and fundamentals",
  intermediate: "For traders with some experience looking to enhance their skills",
  advanced: "Advanced strategies and complex concepts for experienced traders"
};

export default function CreateCoursePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "beginner",
      category: "",
      duration: "",
      price: "0",
      thumbnail: "",
      learning_objectives: "",
      prerequisites: "",
      tags: "",
    },
  });

  useEffect(() => {
    async function checkCoachAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if user is a coach
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'coach') {
          toast({
            title: "Access Denied",
            description: "You must be a verified coach to create courses.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }

        // Check subscription status
        if (profile.subscription_status !== 'active') {
          toast({
            title: "Subscription Required",
            description: "You need an active subscription to create courses.",
            variant: "destructive",
          });
          router.push('/pricing');
          return;
        }

        setCurrentUser(user);
      } catch (error: any) {
        console.error('Error checking coach access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkCoachAccess();
  }, [router, toast]);

  async function handleThumbnailUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadThumbnail(): Promise<string | null> {
    if (!thumbnailFile || !currentUser) return null;

    try {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${currentUser.id}/course-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(fileName, thumbnailFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }
  }

  async function onSubmit(data: CourseFormValues) {
    if (!currentUser) return;

    setSaving(true);
    try {
      // Upload thumbnail if provided
      let thumbnailUrl = data.thumbnail;
      if (thumbnailFile) {
        const uploadedUrl = await uploadThumbnail();
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }

      // Process tags
      const tagsArray = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description,
          level: data.level,
          category: data.category,
          duration: data.duration,
          price: parseFloat(data.price),
          thumbnail: thumbnailUrl,
          learning_objectives: data.learning_objectives,
          prerequisites: data.prerequisites || null,
          tags: tagsArray,
          coach_id: currentUser.id,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (courseError) throw courseError;

      toast({
        title: "Course Created",
        description: "Your course has been created successfully. You can now add content and publish it.",
      });

      // Redirect to course management or classroom
      router.push(`/classroom?tab=courses&level=${data.level}`);
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

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
          <Link href="/classroom">
            <ChevronLeft className="h-4 w-4" />
            Back to Classroom
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create New Course</h1>
            <p className="text-muted-foreground">Design a comprehensive learning experience for your students</p>
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
                <CardTitle className="text-2xl">{form.watch('title') || 'Course Title'}</CardTitle>
                <CardDescription className="mt-2">
                  {form.watch('description') || 'Course description will appear here...'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {form.watch('level')}
                </Badge>
                <Badge variant="secondary">
                  {form.watch('category') || 'Category'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Course thumbnail"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Learning Objectives</h3>
                  <p className="text-sm text-muted-foreground">
                    {form.watch('learning_objectives') || 'Learning objectives will be displayed here...'}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <Clock className="h-4 w-4 inline mr-1" />
                    {form.watch('duration') || 'Duration'}
                  </div>
                  <div className="font-medium">
                    ${form.watch('price') || '0'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Edit Mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Basics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Advanced Technical Analysis Strategies" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a comprehensive description of what students will learn..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Learning Path</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(LEVEL_DESCRIPTIONS).map(([level, description]) => (
                                  <SelectItem key={level} value={level}>
                                    <div>
                                      <div className="font-medium capitalize">{level}</div>
                                      <div className="text-xs text-muted-foreground">{description}</div>
                                    </div>
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
                        name="category"
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
                                {COURSE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Course Thumbnail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        {thumbnailPreview ? (
                          <div className="relative">
                            <img
                              src={thumbnailPreview}
                              alt="Thumbnail preview"
                              className="w-full h-32 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setThumbnailFile(null);
                                setThumbnailPreview(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload a course thumbnail
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                              id="thumbnail-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('thumbnail-upload')?.click()}
                            >
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 16:9 aspect ratio, max 5MB
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Course Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="learning_objectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Objectives</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What will students achieve after completing this course?"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Clearly define what students will learn and be able to do
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prerequisites"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prerequisites (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What should students know before taking this course?"
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="trading, analysis, strategy (comma separated)"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Add tags to help students find your course
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Pricing & Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 4 weeks, 10 hours, 15 lessons" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Set to 0 for free courses
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/classroom')}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Course
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