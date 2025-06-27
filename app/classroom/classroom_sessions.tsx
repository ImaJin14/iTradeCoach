import Link from "next/link";
import { Calendar, Play, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  title: string;
  scheduled_time: string;
  duration: number;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  student_count: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | null;
  type: string;
  level: string;
  notes?: string;
}

// ✅ FIXED: Course interface matches exactly with page.tsx
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
  is_hidden: boolean | null; // ✅ FIXED: Allow null to match database
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

interface ClassroomSessionsProps {
  sessions: Session[];
  courses: Course[];
  userRole: string;
  learningPaths: LearningPath[];
  showPathsTab?: boolean;
  showProgressTab?: boolean;
}

export default function ClassroomSessions({ 
  sessions, 
  courses, 
  userRole, 
  learningPaths,
  showPathsTab = false,
  showProgressTab = false
}: ClassroomSessionsProps) {

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

  // Learning Paths Tab Content
  if (showPathsTab) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Paths</CardTitle>
          <CardDescription>
            Manage your learning paths for different skill levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {learningPaths.map((path) => (
              <Card key={path.id} className="border-2 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {path.name}
                    <Badge variant="outline" className="capitalize">
                      {path.level}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Courses:</span>
                      <span className="font-medium">{path.course_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Students:</span>
                      <span className="font-medium">{path.student_count}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline" asChild>
                    <Link href={`/courses/create?level=${path.level}`}>
                      Add Course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {learningPaths.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No learning paths available yet
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Progress Tab Content  
  if (showProgressTab) {
    const coursesWithProgress = courses.filter(c => c.progress > 0);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>
            Track your progress across all enrolled courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {coursesWithProgress.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">{course.coach_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{course.progress}%</div>
                    <div className="text-sm text-muted-foreground">
                      {getStatusBadge(course.status, course.progress, course.is_hidden)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {coursesWithProgress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No course progress to display yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default Sessions Tab Content
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Sessions</CardTitle>
        <CardDescription>
          {userRole === 'coach'
            ? "Your scheduled coaching sessions with students"
            : "Your upcoming coaching sessions"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{session.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.scheduled_time).toLocaleDateString()} at{' '}
                      {new Date(session.scheduled_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={session.coach_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach_id}`}
                    />
                    <AvatarFallback className="text-xs">{session.coach_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{session.coach_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{session.type}</Badge>
                <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                  {session.status || 'Scheduled'}
                </Badge>
                <Button size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Join Session
                </Button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming sessions scheduled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}