import { BookOpen, Users, Calendar, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassroomStatsData {
  totalCourses: number;
  completedCourses: number;
  activeSessions: number;
  totalStudents?: number;
  tokensEarned?: number;
}

interface ClassroomStatsProps {
  stats: ClassroomStatsData | null;
  userRole: string;
}

export default function ClassroomStats({ stats, userRole }: ClassroomStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid gap-6 md:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {userRole === 'coach' ? 'Courses Created' : 'Enrolled Courses'}
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCourses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {userRole === 'coach' ? 'Published Courses' : 'Completed Sessions'}
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedCourses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSessions}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {userRole === 'coach' ? 'Total Students' : 'Tokens Earned'}
          </CardTitle>
          {userRole === 'coach' ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {userRole === 'coach' ? stats.totalStudents : stats.tokensEarned}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}