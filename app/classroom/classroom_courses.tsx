import { useState } from "react";
import { Search, Clock, Users, Play, Edit, Trash2, EyeOff, Eye, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  duration: string | null;
  progress: number;
  status: 'draft' | 'published' | 'archived' | null;
  thumbnail: string | null;
  category: string | null;
  enrolled_count: number;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  created_at: string;
  updated_at: string;
  price: number;
  is_hidden: boolean | null;
  student_id: string | null;
}

interface LearningPath {
  id: string;
  name: string;
  level: string;
  description: string;
  course_count: number;
  student_count: number;
  coach_id: string;
}

interface ClassroomCoursesProps {
  courses: Course[];
  userRole: string;
  onRefresh: () => Promise<void>;
  learningPaths: LearningPath[];
}

export default function ClassroomCourses({ 
  courses, 
  userRole, 
  onRefresh, 
  learningPaths 
}: ClassroomCoursesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPath, setSelectedPath] = useState<string>("all");
  const { toast } = useToast();

  async function handleToggleCourseVisibility(courseId: number, currentlyHidden: boolean | null) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_hidden: !currentlyHidden })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: currentlyHidden ? "Course Shown" : "Course Hidden",
        description: currentlyHidden 
          ? "The course is now visible to students and will appear in search results."
          : "The course has been hidden from students and will not appear in search results.",
      });

      await onRefresh();
    } catch (error: any) {
      console.error('Error toggling course visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update course visibility. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCourse(courseId: number) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Course Deleted",
        description: "The course has been permanently deleted.",
      });

      await onRefresh();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      course.coach_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesPath = selectedPath === "all" || course.level === selectedPath.split('-')[1];

    return matchesSearch && matchesLevel && matchesCategory && matchesPath;
  });

  const getStatusBadge = (status: string | null, progress: number, isHidden: boolean | null) => {
    if (isHidden) {
      return <Badge variant="outline" className="text-gray-500">Hidden</Badge>;
    }

    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        if (progress > 0) {
          return <Badge variant="secondary">In Progress ({progress}%)</Badge>;
        }
        return <Badge variant="outline">{status || 'Draft'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        {userRole !== 'coach' && learningPaths.length > 0 && (
          <Select value={selectedPath} onValueChange={setSelectedPath}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select learning path" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Paths</SelectItem>
              {learningPaths.map((path) => (
                <SelectItem key={path.id} value={path.id}>
                  {path.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${course.is_hidden ? 'opacity-60' : ''}`}>
            <div className="aspect-video relative">
              <img
                src={course.thumbnail || 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg'}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  {userRole === 'coach' ? 'Manage' : 'Continue'}
                </Button>
              </div>
              {course.is_hidden && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-gray-500 text-white">
                    Hidden
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(course.status, course.progress, course.is_hidden)}
                  {userRole === 'coach' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleCourseVisibility(course.id, course.is_hidden)}>
                          {course.is_hidden ? (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Show Course
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide Course
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Course
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{course.title}" and remove all student enrollments.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourse(course.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Course
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {course.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={course.coach_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.coach_id}`}
                  />
                  <AvatarFallback className="text-xs">{course.coach_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{course.coach_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.duration || 'N/A'}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.enrolled_count} students
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {course.level || 'All Levels'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">${course.price}</span>
                {userRole === 'student' && course.progress > 0 && (
                  <span className="text-sm text-muted-foreground">{course.progress}% complete</span>
                )}
              </div>
              {userRole === 'student' && course.progress > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {courses.length === 0
            ? userRole === 'coach'
              ? "No courses created yet. Start by creating your first course!"
              : "No courses enrolled yet. Browse available courses to get started!"
            : "No courses found matching your criteria"
          }
        </div>
      )}
    </div>
  );
}