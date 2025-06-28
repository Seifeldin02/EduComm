import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/chat/FileUpload";
import { toast } from "sonner";
import { Assignment } from "@/types/course";
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  ArrowLeft,
} from "react-feather";

export default function CourseAssignmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    if (user && courseId) {
      fetchAssignments();
    }
  }, [user, courseId]);

  const fetchAssignments = async () => {
    if (!user || !courseId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:3000/api/assignments", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(
          (data.assignments || []).filter(
            (a: Assignment) => a.courseId === courseId
          )
        );
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;
    try {
      const token = await user.getIdToken();
      const body: any = {
        courseId,
        title,
        description,
        instructions,
        dueDate,
        maxPoints,
        allowLateSubmission,
      };
      if (file) body.fileAttachment = file;
      const res = await fetch("http://localhost:3000/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Assignment created successfully!");
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setInstructions("");
        setDueDate("");
        setMaxPoints(100);
        setAllowLateSubmission(false);
        setFile(null);
        fetchAssignments();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create assignment");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create assignment"
      );
    }
  };

  const handleViewSubmissions = (assignmentId: string) => {
    navigate(
      `/lecturer/courses/${courseId}/assignments/${assignmentId}/submissions`
    );
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(`/lecturer/courses/${courseId}`)}
              className="flex items-center gap-2 mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No assignments yet
              </h3>
              <p className="text-gray-500">
                Start by creating an assignment for this course.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-500" />
                        {assignment.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {" "}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toast.info("Edit assignment not implemented yet.");
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toast.info("Delete assignment not implemented yet.")
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-2">
                      {assignment.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </Badge>
                      <Badge variant="secondary">
                        {assignment.maxPoints} pts
                      </Badge>
                    </div>
                    {assignment.fileAttachment && (
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `http://localhost:3000${
                                assignment.fileAttachment!.url
                              }`,
                              "_blank"
                            );
                          }}
                        >
                          <Download className="w-4 h-4" />
                          {assignment.fileAttachment.originalName}
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmissions(assignment.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Submissions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Assignment Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleCreateAssignment}
                className="space-y-4 mt-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter assignment description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructions</label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter assignment instructions"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Max Points</label>
                  <Input
                    type="number"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(Number(e.target.value))}
                    min={1}
                    max={1000}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowLateSubmission"
                    checked={allowLateSubmission}
                    onChange={(e) => setAllowLateSubmission(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="allowLateSubmission" className="text-sm">
                    Allow late submission
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Attachment</label>
                  <FileUpload onFileUploaded={setFile} />
                  {file && (
                    <div className="text-xs text-green-600">
                      {file.originalName} uploaded
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Create Assignment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
