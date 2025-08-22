import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: string;
}

export default function DatabaseTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const initialTests: TestResult[] = [
    {
      name: "Database Connection",
      status: "pending",
      message: "Testing connection...",
    },
    {
      name: "Job Applications Table",
      status: "pending",
      message: "Checking table exists...",
    },
    {
      name: "Contacts Table",
      status: "pending",
      message: "Checking table exists...",
    },
    {
      name: "Get Started Requests Table",
      status: "pending",
      message: "Checking table exists...",
    },
    {
      name: "Resume Uploads Table",
      status: "pending",
      message: "Checking table exists...",
    },
    {
      name: "Storage Bucket",
      status: "pending",
      message: "Checking file storage...",
    },
  ];

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setTesting(true);
    setTests(initialTests);

    const results: TestResult[] = [];

    // Test 1: Database Connection
    try {
      const { error } = await supabase.from("_").select("*").limit(1);
      if (error && error.code === "PGRST116") {
        results.push({
          name: "Database Connection",
          status: "success",
          message: "Successfully connected to Supabase database",
        });
      } else if (error) {
        results.push({
          name: "Database Connection",
          status: "error",
          message: "Failed to connect to database",
          details: error.message,
        });
      } else {
        results.push({
          name: "Database Connection",
          status: "success",
          message: "Database connection established",
        });
      }
    } catch (error) {
      results.push({
        name: "Database Connection",
        status: "error",
        message: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 2: Job Applications Table
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .limit(1);

      if (error) {
        results.push({
          name: "Job Applications Table",
          status: "error",
          message: "Table not found or inaccessible",
          details: error.message,
        });
      } else {
        results.push({
          name: "Job Applications Table",
          status: "success",
          message: `Table exists (${data?.length || 0} records)`,
        });
      }
    } catch (error) {
      results.push({
        name: "Job Applications Table",
        status: "error",
        message: "Failed to access table",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 3: Contacts Table
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .limit(1);

      if (error) {
        results.push({
          name: "Contacts Table",
          status: "error",
          message: "Table not found or inaccessible",
          details: error.message,
        });
      } else {
        results.push({
          name: "Contacts Table",
          status: "success",
          message: `Table exists (${data?.length || 0} records)`,
        });
      }
    } catch (error) {
      results.push({
        name: "Contacts Table",
        status: "error",
        message: "Failed to access table",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 4: Get Started Requests Table
    try {
      const { data, error } = await supabase
        .from("get_started_requests")
        .select("*")
        .limit(1);

      if (error) {
        results.push({
          name: "Get Started Requests Table",
          status: "warning",
          message: "Optional table not found",
          details: error.message,
        });
      } else {
        results.push({
          name: "Get Started Requests Table",
          status: "success",
          message: `Table exists (${data?.length || 0} records)`,
        });
      }
    } catch (error) {
      results.push({
        name: "Get Started Requests Table",
        status: "warning",
        message: "Optional table not accessible",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 5: Resume Uploads Table
    try {
      const { data, error } = await supabase
        .from("resume_uploads")
        .select("*")
        .limit(1);

      if (error) {
        results.push({
          name: "Resume Uploads Table",
          status: "warning",
          message: "Optional table not found",
          details: error.message,
        });
      } else {
        results.push({
          name: "Resume Uploads Table",
          status: "success",
          message: `Table exists (${data?.length || 0} records)`,
        });
      }
    } catch (error) {
      results.push({
        name: "Resume Uploads Table",
        status: "warning",
        message: "Optional table not accessible",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 6: Storage Bucket
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        results.push({
          name: "Storage Bucket",
          status: "warning",
          message: "Storage not accessible",
          details: error.message,
        });
      } else {
        const resumeBucket = buckets?.find(
          (bucket) => bucket.name === "resumes",
        );
        if (resumeBucket) {
          results.push({
            name: "Storage Bucket",
            status: "success",
            message: "Resume storage bucket exists",
          });
        } else {
          results.push({
            name: "Storage Bucket",
            status: "warning",
            message: "Resume bucket not found - file uploads may not work",
            details: "Create a 'resumes' bucket in Supabase Storage",
          });
        }
      }
    } catch (error) {
      results.push({
        name: "Storage Bucket",
        status: "warning",
        message: "Storage test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setTests(results);
    setTesting(false);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "pending":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "pending":
        return "border-blue-200 bg-blue-50";
    }
  };

  const criticalErrors = tests.filter((t) => t.status === "error");
  const warnings = tests.filter((t) => t.status === "warning");
  const successes = tests.filter((t) => t.status === "success");

  return (
    <div className="min-h-screen bg-gradient-to-br from-tech-dark via-primary/10 to-background">
      <Header />

      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-8 h-8 text-tech-blue" />
              <h1 className="text-4xl font-bold text-foreground">
                Database <span className="text-gradient">Setup Test</span>
              </h1>
            </div>
            <p className="text-foreground/70">
              Verify your Supabase database configuration and table setup
            </p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Success
                  </h3>
                  <p className="text-green-600">
                    {successes.length} tests passed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Warnings
                  </h3>
                  <p className="text-yellow-600">
                    {warnings.length} optional features
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Errors</h3>
                  <p className="text-red-600">
                    {criticalErrors.length} critical issues
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-card-bg border border-border-subtle rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Test Results
              </h2>
              <button
                onClick={runTests}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${testing ? "animate-spin" : ""}`}
                />
                {testing ? "Running Tests..." : "Retry Tests"}
              </button>
            </div>

            <div className="space-y-4">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {test.name}
                      </h3>
                      <p className="text-foreground/70 mt-1">{test.message}</p>
                      {test.details && (
                        <div className="mt-2 p-3 bg-background/50 rounded border text-sm text-foreground/60">
                          <strong>Details:</strong> {test.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Instructions */}
          {criticalErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">
                Setup Required
              </h3>
              <div className="prose prose-sm max-w-none">
                <ol className="text-red-700">
                  <li>
                    Go to your{" "}
                    <a
                      href="https://supabase.com/dashboard/project/jrjwiamibemyxubqudgg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Supabase Dashboard
                    </a>
                  </li>
                  <li>
                    Navigate to <strong>SQL Editor</strong>
                  </li>
                  <li>
                    Create a new query and paste the contents of{" "}
                    <code>database-migration.sql</code>
                  </li>
                  <li>
                    Run the migration script to create all necessary tables
                  </li>
                  <li>Return here and click "Retry Tests" to verify setup</li>
                </ol>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-center mt-8">
            <a
              href="/admin"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
