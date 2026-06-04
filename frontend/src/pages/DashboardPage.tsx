import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  FolderOpen,
  Users,
  Tag,
  HardDrive,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { statsApi, videosApi, projectsApi } from "../api";
import { useAuthStore } from "../stores/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { formatBytes, formatDuration, formatDate } from "../lib/utils";
import type { Stats, Video as VideoType, Project } from "../types";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { canUpload } = useAuthStore();

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, videosRes, projectsRes] = await Promise.all([
          statsApi.get(),
          videosApi.list({ limit: 6, sort_by: "created_at", sort_order: "desc" }),
          projectsApi.list(),
        ]);
        setStats(statsRes.data.data);
        setRecentVideos(videosRes.data.data);
        setProjects(projectsRes.data.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Videos", value: stats?.total_videos ?? 0, icon: Video, color: "text-red-500" },
    { label: "Projects", value: stats?.total_projects ?? 0, icon: FolderOpen, color: "text-amber-500" },
    { label: "Users", value: stats?.total_users ?? 0, icon: Users, color: "text-green-500" },
    { label: "Tags", value: stats?.total_tags ?? 0, icon: Tag, color: "text-purple-500" },
    { label: "Storage Used", value: stats?.total_storage_human ?? "0 B", icon: HardDrive, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your video archive</p>
        </div>
        {canUpload() && (
          <Link to="/upload">
            <Button>Upload Video</Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Videos + Projects */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Videos */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Videos</h2>
            <Link to="/videos">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          {recentVideos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No videos uploaded yet. Start by uploading your first video!
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentVideos.map((video) => (
                <Link key={video.id} to={`/videos/${video.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={`/api/videos/${video.id}/thumbnail`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "";
                          (e.target as HTMLImageElement).classList.add("flex", "items-center", "justify-center");
                        }}
                      />
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{video.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {video.project_name} &middot; {formatBytes(video.file_size)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Projects Sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link to="/projects">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No projects yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 8).map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                        {project.video_count ?? 0}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
