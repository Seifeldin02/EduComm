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
import { FileUpload } from "@/components/chat/FileUpload";
import { toast } from "sonner";
import { Assignment } from "@/types/course";
import { Download, Upload, Calendar, FileText, ArrowLeft } from "react-feather";

export default function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && assignmentId) {
      fetchAssignment();
    }
    // eslint-disable-next-line
  }, [user, assignmentId]);

  const fetchAssignment = async () => {
    if (!user || !assignmentId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/assignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const found = (data.assignments || []).find(
          (a: Assignment) => a.id === assignmentId
        );
        setAssignment(found || null);
        setSubmission(found?.userSubmission || null);
      } else {
        setAssignment(null);
        setSubmission(null);
      }
      // Fetch submission info
      const subRes = await fetch(
        `http://localhost:3000/api/assignments/${assignmentId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmission(subData.submission || null);
        setCanSubmit(subData.canSubmit);
      }
    } catch (error) {
      setAssignment(null);
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignmentId || !file) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `http://localhost:3000/api/assignments/${assignmentId}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileAttachment: file }),
        }
      );
      if (res.ok) {
        toast.success("Assignment submitted!");
        fetchAssignment();
        setFile(null);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit assignment");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit assignment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(`http://localhost:3000${url}`);
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

  if (!assignment) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-800">
              Assignment not found
            </h2>
            <Button
              className="mt-4"
              onClick={() => navigate("/student/assignments")}
            >
              Back to Assignments
            </Button>
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
            onClick={() => navigate("/student/assignments")}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assignments
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                {assignment.title}
              </CardTitle>
              <CardDescription>{assignment.description}</CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due: {new Date(assignment.dueDate).toLocaleString()}
                </Badge>
                <Badge variant="secondary">{assignment.maxPoints} pts</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="font-medium mb-1">Instructions:</div>
                <div className="text-gray-700 whitespace-pre-line">
                  {assignment.instructions}
                </div>
              </div>
              {assignment.fileAttachment && (
                <div className="mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        assignment.fileAttachment!.url,
                        assignment.fileAttachment!.originalName
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {assignment.fileAttachment.originalName}
                  </Button>
                </div>
              )}
              {/* Submission Section */}
              <div className="mt-6">
                <div className="font-medium mb-2">Your Submission</div>
                {submission ? (
                  <div className="bg-gray-50 p-3 rounded-lg mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Submitted at:</span>
                      <span>
                        {new Date(submission.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    {submission.fileAttachment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            submission.fileAttachment.url,
                            submission.fileAttachment.originalName
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {submission.fileAttachment.originalName}
                      </Button>
                    )}
                    {submission.grade !== undefined && (
                      <div className="mt-2 bg-green-50 p-2 rounded">
                        <span className="font-medium text-green-700">
                          Grade:
                        </span>{" "}
                        {submission.grade} / {assignment.maxPoints}
                        {submission.feedback && (
                          <div className="text-green-700 mt-1">
                            Feedback: {submission.feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : canSubmit ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <FileUpload onFileUploaded={setFile} />
                    {file && (
                      <div className="text-xs text-green-600">
                        {file.originalName} uploaded
                      </div>
                    )}
                    <Button type="submit" disabled={!file || submitting}>
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-red-600">
                    You cannot submit this assignment (deadline passed or
                    already submitted).
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
