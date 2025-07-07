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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Award, Calendar, User, ArrowLeft } from "react-feather";
import { API_CONFIG } from "@/config/api";
export default function LecturerAssignmentSubmissionsPage() {
  const { courseId, assignmentId } = useParams<{
    courseId: string;
    assignmentId: string;
  }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<{ [id: string]: boolean }>({});
  const [grade, setGrade] = useState<{ [id: string]: number }>({});
  const [feedback, setFeedback] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (user && assignmentId) {
      fetchSubmissions();
    }
    // eslint-disable-next-line
  }, [user, assignmentId]);

  const fetchSubmissions = async () => {
    if (!user || !assignmentId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/assignments/${assignmentId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleGrade = async (submissionId: string) => {
    if (!user || !assignmentId) return;
    setGrading((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/assignments/${assignmentId}/submissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            submissionId,
            grade: grade[submissionId],
            feedback: feedback[submissionId],
          }),
        }
      );
      if (res.ok) {
        toast.success("Submission graded!");
        fetchSubmissions();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to grade submission");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to grade submission"
      );
    } finally {
      setGrading((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </Layout>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() =>
              navigate(`/lecturer/courses/${courseId}/assignments`)
            }
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assignments
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-500" />
                Assignment Submissions
              </CardTitle>
              <CardDescription>
                All student submissions for this assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No submissions yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((sub) => (
                    <Card key={sub.id} className="bg-gray-50">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{sub.studentName}</span>
                          <span className="text-xs text-gray-500">
                            ({sub.studentEmail})
                          </span>
                          {sub.isLate && (
                            <Badge variant="destructive" className="ml-2">
                              Late
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-4 h-4" />
                          Submitted:{" "}
                          {new Date(sub.submittedAt).toLocaleString()}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sub.fileAttachment && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                sub.fileAttachment.url,
                                sub.fileAttachment.originalName
                              )
                            }
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {sub.fileAttachment.originalName}
                          </Button>
                        )}
                        <form
                          className="mt-4 space-y-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleGrade(sub.id);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Grade</label>
                            <Input
                              type="number"
                              value={grade[sub.id] ?? sub.grade ?? ""}
                              onChange={(e) =>
                                setGrade((prev) => ({
                                  ...prev,
                                  [sub.id]: Number(e.target.value),
                                }))
                              }
                              min={0}
                              max={1000}
                              className="w-24"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Feedback
                            </label>
                            <Textarea
                              value={feedback[sub.id] ?? sub.feedback ?? ""}
                              onChange={(e) =>
                                setFeedback((prev) => ({
                                  ...prev,
                                  [sub.id]: e.target.value,
                                }))
                              }
                              placeholder="Enter feedback (optional)"
                            />
                          </div>
                          <Button type="submit" disabled={grading[sub.id]}>
                            {grading[sub.id] ? "Saving..." : "Save Grade"}
                          </Button>
                        </form>
                        {sub.grade !== undefined && (
                          <div className="mt-2 bg-green-50 p-2 rounded">
                            <span className="font-medium text-green-700">
                              Grade:
                            </span>{" "}
                            {sub.grade}
                            {sub.feedback && (
                              <div className="text-green-700 mt-1">
                                Feedback: {sub.feedback}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
