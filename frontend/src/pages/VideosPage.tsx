import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Video, Loader2, SlidersHorizontal } from "lucide-react";
import { videosApi, projectsApi, tagsApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatBytes, formatDuration, formatDate } from "../lib/utils";
import type { Video as VideoType, Project, Tag, VideoFilters } from "../types";

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<VideoFilters>({
    page: 1,
    limit: 20,
    sort_by: "created_at",
    sort_order: "desc",
  });

  const [searchInput, setSearchInput] = useState("");

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await videosApi.list(filters);
      setVideos(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Load videos error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [projectsRes, tagsRes] = await Promise.all([projectsApi.list(), tagsApi.list()]);
        setProjects(projectsRes.data.data);
        setTags(tagsRes.data.data);
      } catch (err) {
        console.error("Load filters error:", err);
      }
    }
    loadFilters();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, sort_by: "created_at", sort_order: "desc" });
    setSearchInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-muted-foreground">
            {pagination.total} video{pagination.total !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search videos by title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Project</label>
                <Select
                  value={filters.project_id || "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, project_id: v === "all" ? undefined : v, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Tag</label>
                <Select
                  value={filters.tag || "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, tag: v === "all" ? undefined : v, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Sort By</label>
                <Select
                  value={filters.sort_by}
                  onValueChange={(v) =>
                    setFilters({ ...filters, sort_by: v as VideoFilters["sort_by"], page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="file_size">Size</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Order</label>
                <Select
                  value={filters.sort_order}
                  onValueChange={(v) =>
                    setFilters({ ...filters, sort_order: v as "asc" | "desc", page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest first</SelectItem>
                    <SelectItem value="asc">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No videos found</h3>
            <p className="text-muted-foreground mt-1">
              {filters.search || filters.project_id || filters.tag
                ? "Try adjusting your search or filters."
                : "Upload your first video to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((video) => (
              <Link key={video.id} to={`/videos/${video.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={`/api/videos/${video.id}/thumbnail`}
                      alt={video.title}
                      className="w-full h-full object-cover"
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
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {video.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag.name}
                        </Badge>
                      ))}
                      {video.tags.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{video.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
