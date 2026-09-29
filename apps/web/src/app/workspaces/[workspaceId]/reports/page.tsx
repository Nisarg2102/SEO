'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface WeeklyReport {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  bestPerformingContent: string;
  weakPerformingContent: string;
  observedPatterns: string;
  seoOpportunities: string;
  contentRefreshOpportunities: string;
  suggestedExperiments: string;
  nextWeekIdeas: string;
  createdAt: string;
}

export default function ReportsPage({ params }: { params: { workspaceId: string } }) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<WeeklyReport[]>(`workspaces/${params.workspaceId}/reports`);
      setReports(data);
      if (data.length > 0) setSelectedReport(data[0]);
    } catch {
      console.error("Error");
    }
    setLoading(false);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await apiClient.post(`workspaces/${params.workspaceId}/reports/generate`);
      await fetchReports();
    } catch {
      console.error("Error");
    }
    setGenerating(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReports(); }, [params.workspaceId]);

  const renderList = (jsonString: string) => {
    try {
      const list = JSON.parse(jsonString);
      if (!Array.isArray(list) || list.length === 0) return <p className="text-gray-500 italic">None found.</p>;
      return (
        <ul className="list-disc pl-5 space-y-1 mt-2">
          {list.map((item, idx) => (
            <li key={idx} className="text-gray-700">{item}</li>
          ))}
        </ul>
      );
    } catch {
      return <p>{jsonString}</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Performance Reports</h1>
          <p className="text-gray-500 text-sm">Deep analysis of your content and SEO telemetry to uncover actionable patterns.</p>
        </div>
        <button 
          onClick={generateReport}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded shadow-sm disabled:opacity-50"
        >
          {generating ? 'Analyzing Data...' : 'Generate New Report'}
        </button>
      </div>

      {loading ? (
        <div>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No AI reports have been generated yet.</p>
          <button 
            onClick={generateReport}
            className="text-purple-600 font-medium hover:underline"
          >
            Generate your first report
          </button>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="w-1/3 space-y-3">
            <h2 className="font-semibold text-gray-700">Past Reports</h2>
            {reports.map(report => (
              <div 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 rounded border cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:border-purple-300'}`}
              >
                <div className="font-medium text-gray-900">
                  Week of {new Date(report.weekStartDate).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Generated {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {selectedReport && (
            <div className="w-2/3 bg-white p-6 rounded shadow-sm border border-gray-200 space-y-8 h-[800px] overflow-y-auto">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Weekly Intelligence Report</h3>
                <p className="text-sm text-gray-500">
                  {new Date(selectedReport.weekStartDate).toLocaleDateString()} - {new Date(selectedReport.weekEndDate).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <h4 className="font-bold text-blue-900 flex items-center">
                  <span className="mr-2">🔍</span> Observed Patterns & Insights
                </h4>
                {renderList(selectedReport.observedPatterns)}
                <div className="mt-4 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  <strong>Note:</strong> Patterns indicate correlation based on the analyzed sample, not necessarily causation.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-green-700 border-b pb-2">Top Performers</h4>
                  {renderList(selectedReport.bestPerformingContent)}
                </div>
                <div>
                  <h4 className="font-bold text-red-700 border-b pb-2">Underperformers</h4>
                  {renderList(selectedReport.weakPerformingContent)}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-purple-700 border-b pb-2">Suggested Experiments</h4>
                {renderList(selectedReport.suggestedExperiments)}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-800 border-b pb-2">SEO Opportunities</h4>
                  {renderList(selectedReport.seoOpportunities)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 border-b pb-2">Content Refresh Ideas</h4>
                  {renderList(selectedReport.contentRefreshOpportunities)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">Recommended Next Steps (Content Ideas)</h4>
                {renderList(selectedReport.nextWeekIdeas)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
