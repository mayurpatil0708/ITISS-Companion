import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Database,
  Upload,
  Download,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
  FileJson,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useApp } from '@/context/AppContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { QuestionBankValidator, ValidationReport } from '@/services/validation/bank-validator';
import { Question, Subject, Difficulty } from '@/types';

export const QuestionBankPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');

  const { addNotification, bookmarks, toggleBookmark } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState(highlightedId || '');
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [subtopicFilter, setSubtopicFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Inspect & Edit Modal
  const [inspectQuestion, setInspectQuestion] = useState<Question | null>(null);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  // Import Modal & State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importReport, setImportReport] = useState<ValidationReport | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirm Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Reset/Re-seed Bank Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Load questions
  const loadQuestions = async () => {
    try {
      const allQ = await questionRepository.getAllQuestions();
      setQuestions(allQ);
      if (highlightedId) {
        const found = allQ.find((q) => q.question_id === highlightedId);
        if (found) setInspectQuestion(found);
      }
    } catch (e) {
      console.error('Failed to load questions', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [highlightedId]);

  // Compute available subtopics for current subject filter
  const availableSubtopics = useMemo(() => {
    const subMap = new Map<string, number>();
    for (const q of questions) {
      const matchesSubject =
        subjectFilter === 'all' ||
        q.subject === subjectFilter ||
        (subjectFilter === 'cosa' && (q.subject === 'linux' || q.subject === 'windows' || q.subject === 'cross_platform')) ||
        (subjectFilter === 'fundamental-computer-networks' && q.subject === 'fcn') ||
        (subjectFilter === 'programming-concepts' && q.subject === 'pc') ||
        (subjectFilter === 'it-infrastructure-devops' && (q.subject === 'iimd' || q.subject === 'itid'));

      if (matchesSubject && q.subtopic) {
        subMap.set(q.subtopic, (subMap.get(q.subtopic) || 0) + 1);
      }
    }
    return Array.from(subMap.entries())
      .map(([subtopic, count]) => ({ subtopic, count }))
      .sort((a, b) => b.count - a.count);
  }, [questions, subjectFilter]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Subject filtering with alias support
      if (subjectFilter !== 'all') {
        if (subjectFilter === 'cosa') {
          if (q.subject !== 'cosa' && q.subject !== 'linux' && q.subject !== 'windows' && q.subject !== 'cross_platform') return false;
        } else if (subjectFilter === 'fundamental-computer-networks') {
          if (q.subject !== 'fundamental-computer-networks' && q.subject !== 'fcn') return false;
        } else if (subjectFilter === 'programming-concepts') {
          if (q.subject !== 'programming-concepts' && q.subject !== 'pc') return false;
        } else if (subjectFilter === 'it-infrastructure-devops') {
          if (q.subject !== 'it-infrastructure-devops' && q.subject !== 'itid' && q.subject !== 'iimd') return false;
        } else if (q.subject !== subjectFilter) {
          return false;
        }
      }

      // Subtopic filtering
      if (subtopicFilter !== 'all') {
        const matchesSub = q.subtopic === subtopicFilter || q.subtopic_id === subtopicFilter || q.subtopicName === subtopicFilter;
        if (!matchesSub) return false;
      }

      // Difficulty filtering
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

      // Text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = q.question_id.toLowerCase().includes(query);
        const matchesText = (q.question_text || q.question || '').toLowerCase().includes(query);
        const matchesTopic = (q.topic || '').toLowerCase().includes(query);
        const matchesSubtopic = (q.subtopic || '').toLowerCase().includes(query);
        const matchesTags = q.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesId && !matchesText && !matchesTopic && !matchesSubtopic && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [questions, subjectFilter, subtopicFilter, difficultyFilter, searchQuery]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedQuestionIds.size === filteredQuestions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(filteredQuestions.map((q) => q.question_id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export selected or all questions
  const handleExport = (exportAll = false) => {
    const listToExport = exportAll
      ? questions
      : questions.filter((q) => selectedQuestionIds.has(q.question_id));

    if (listToExport.length === 0) {
      alert('Please select at least one question to export.');
      return;
    }

    const exportData = {
      schema_version: '1.0.0',
      exported_at: new Date().toISOString(),
      question_count: listToExport.length,
      questions: listToExport,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_question_bank_export_${exportAll ? 'full' : 'selected'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Export Complete',
      message: `Exported ${listToExport.length} questions to JSON.`,
    });
  };

  // Handle file drop / upload for validation
  const handleFileUpload = (file: File) => {
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const existingIds = new Set(questions.map((q) => q.question_id));
      const report = QuestionBankValidator.validateRawJson(content, existingIds);
      setImportReport(report);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
  };

  // Commit valid imported questions
  const handleConfirmImport = async () => {
    if (!importReport || importReport.validQuestions.length === 0) return;
    setIsProcessingImport(true);
    try {
      const count = await questionRepository.saveQuestions(importReport.validQuestions);
      await loadQuestions();
      setIsImportModalOpen(false);
      setImportReport(null);
      addNotification({
        type: 'success',
        title: 'Import Successful',
        message: `Successfully validated and merged ${count} questions into the bank.`,
      });
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to save imported questions');
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    try {
      await questionRepository.deleteQuestion(id);
      await loadQuestions();
      setDeleteTargetId(null);
      addNotification({
        type: 'info',
        title: 'Question Deleted',
        message: `Question ${id} has been removed from database.`,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to delete question');
    }
  };

  // Reset / Re-seed default database
  const handleResetToFactoryBank = async () => {
    setIsProcessingImport(true);
    try {
      await questionRepository.resetAllData();
      await loadQuestions();
      setIsResetModalOpen(false);
      addNotification({
        type: 'success',
        title: 'Question Bank Restored',
        message: 'Successfully re-seeded all 446 CDAC verified questions.',
      });
    } catch (e) {
      console.error(e);
      alert('Failed to restore initial bank');
    } finally {
      setIsProcessingImport(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Asset Management</Badge>
            <span className="text-xs font-mono text-nexus-text-muted">IndexedDB Local Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
            Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
            Import custom JSON banks, validate schemas, inspect questions and sources, or export certified question sets.
          </p>
        </div>

        {/* Global Bank Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <Button
            variant="outline"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleExport(false)}
            disabled={selectedQuestionIds.size === 0}
          >
            Export Selected ({selectedQuestionIds.size})
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleExport(true)}
          >
            Export All ({questions.length})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => setIsResetModalOpen(true)}
            title="Restore default CDAC bank"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card padding="md" className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-nexus-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, command, or topic..."
              className="w-full bg-nexus-elevated border border-nexus-border rounded pl-9 pr-3 py-1.5 text-xs text-nexus-text placeholder:text-nexus-text-muted focus:outline-none focus:border-nexus-accent"
            />
          </div>

          {/* Subject / Module Filter */}
          <div className="sm:col-span-3">
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value as any);
                setSubtopicFilter('all');
              }}
              className="w-full bg-nexus-elevated border border-nexus-border rounded px-3 py-1.5 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
            >
              <option value="all">All Modules ({questions.length})</option>
              <option value="fundamental-computer-networks">Computer Networks (FCN)</option>
              <option value="programming-concepts">Programming Concepts (PC)</option>
              <option value="cosa">Operating Systems (COSA)</option>
              <option value="it-infrastructure-devops">Infra & DevOps (IIMD)</option>
              <option value="linux">Linux & OS (legacy)</option>
              <option value="windows">Windows Server (legacy)</option>
              <option value="cross_platform">Cross-platform (legacy)</option>
            </select>
          </div>

          {/* Subtopic Filter */}
          <div className="sm:col-span-3">
            <select
              value={subtopicFilter}
              onChange={(e) => setSubtopicFilter(e.target.value)}
              className="w-full bg-nexus-elevated border border-nexus-border rounded px-3 py-1.5 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
            >
              <option value="all">All Subtopics ({availableSubtopics.length})</option>
              {availableSubtopics.map((st) => (
                <option key={st.subtopic} value={st.subtopic}>
                  {st.subtopic} ({st.count})
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="sm:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="w-full bg-nexus-elevated border border-nexus-border rounded px-3 py-1.5 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
            >
              <option value="all">All Difficulties</option>
              <option value="foundational">Foundational</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Counter & Select All banner */}
        <div className="flex items-center justify-between text-xs text-nexus-text-muted pt-2 border-t border-nexus-border">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredQuestions.length > 0 &&
                  selectedQuestionIds.size === filteredQuestions.length
                }
                onChange={toggleSelectAll}
                className="rounded text-nexus-accent focus:ring-nexus-accent"
              />
              <span>Select All Displayed</span>
            </label>
            <span>•</span>
            <span>
              Showing {filteredQuestions.length} of {questions.length} total questions
            </span>
          </div>

          {selectedQuestionIds.size > 0 && (
            <span className="font-mono text-nexus-cyan">
              {selectedQuestionIds.size} selected
            </span>
          )}
        </div>
      </Card>

      {/* Questions Data Table */}
      <Card padding="none" className="overflow-hidden border border-nexus-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-nexus-elevated/70 border-b border-nexus-border font-mono text-nexus-text-muted text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-28">ID</th>
                <th className="py-2.5 px-3 w-28">Subject</th>
                <th className="py-2.5 px-3">Question Text</th>
                <th className="py-2.5 px-3 w-36">Topic</th>
                <th className="py-2.5 px-3 w-24">Diff</th>
                <th className="py-2.5 px-3 w-20 text-center">Key</th>
                <th className="py-2.5 px-3 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border/40">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-nexus-text-muted">
                    No questions found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.has(q.question_id);
                  const isHighlighted = q.question_id === highlightedId;

                  return (
                    <tr
                      key={q.question_id}
                      className={`hover:bg-nexus-elevated/40 transition-colors ${
                        isHighlighted ? 'bg-nexus-accent/10' : isSelected ? 'bg-nexus-accent/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(q.question_id)}
                          className="rounded text-nexus-accent focus:ring-nexus-accent"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-nexus-accent">
                        {q.question_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            q.subject === 'linux'
                              ? 'primary'
                              : q.subject === 'windows'
                              ? 'cyan'
                              : 'success'
                          }
                        >
                          {q.subject}
                        </Badge>
                      </td>
                      <td
                        className="py-2.5 px-3 font-medium text-nexus-text max-w-md truncate cursor-pointer hover:text-nexus-cyan"
                        onClick={() => setInspectQuestion(q)}
                        title={q.question_text}
                      >
                        {q.question_text}
                      </td>
                      <td className="py-2.5 px-3 text-nexus-text-secondary truncate max-w-xs">
                        {q.topic}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] capitalize text-nexus-text-muted">
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-nexus-success">
                        {q.correct_option_id}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectQuestion(q)}
                            className="p-1 rounded text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-elevated"
                            title="Inspect Question"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(q.question_id)}
                            className="p-1 rounded text-nexus-text-muted hover:text-nexus-error hover:bg-nexus-elevated"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Modal */}
      {inspectQuestion && (
        <Modal
          isOpen={!!inspectQuestion}
          onClose={() => setInspectQuestion(null)}
          title={`Question Inspector: ${inspectQuestion.question_id}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="cyan">{inspectQuestion.subject.toUpperCase()}</Badge>
              <Badge variant="default">{inspectQuestion.difficulty}</Badge>
              <Badge variant="primary">{inspectQuestion.question_type}</Badge>
              <span className="text-xs text-nexus-text-muted font-mono ml-auto">
                {inspectQuestion.topic} • {inspectQuestion.subtopic}
              </span>
            </div>

            <div className="text-sm font-semibold text-nexus-text leading-relaxed">
              {inspectQuestion.question_text}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono text-nexus-text-muted uppercase">Answer Options</span>
              {inspectQuestion.options.map((opt) => {
                const isKey = opt.id === inspectQuestion.correct_option_id;
                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                      isKey
                        ? 'bg-nexus-success/15 border-nexus-success text-nexus-text font-medium'
                        : 'bg-nexus-elevated/40 border-nexus-border text-nexus-text-secondary'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                        isKey ? 'bg-nexus-success text-white' : 'bg-nexus-surface border border-nexus-border text-nexus-text-muted'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {isKey && <Badge variant="success">Correct Key</Badge>}
                  </div>
                );
              })}
            </div>

            {/* Explanations */}
            <div className="p-3 rounded bg-nexus-elevated/50 border border-nexus-border space-y-2 text-xs">
              <div>
                <strong className="text-nexus-cyan block mb-1">Pedagogical Explanation:</strong>
                <p className="text-nexus-text leading-relaxed">{inspectQuestion.explanation}</p>
              </div>

              {inspectQuestion.option_explanations && (
                <div className="pt-2 border-t border-nexus-border/60 space-y-1">
                  {Object.entries(inspectQuestion.option_explanations).map(([id, exp]) => (
                    <div key={id} className="text-[11px] text-nexus-text-secondary">
                      <strong className="font-mono text-nexus-text-muted">[{id}]:</strong> {exp}
                    </div>
                  ))}
                </div>
              )}

              {inspectQuestion.source?.document_id && (
                <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between text-[11px] font-mono text-nexus-text-muted">
                  <span>Document: {inspectQuestion.source.document_id}</span>
                  <span>Pages: {inspectQuestion.source.pdf_page_start}-{inspectQuestion.source.pdf_page_end}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectQuestion(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import & Validation Report Modal */}
      {isImportModalOpen && importReport && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title={`Import Validation Report: ${importFileName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
                <span className="text-nexus-text-muted block">TOTAL PARSED</span>
                <span className="text-lg font-bold text-nexus-text">{importReport.totalParsed}</span>
              </div>
              <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
                <span className="text-nexus-text-muted block">VALID RECORDS</span>
                <span className="text-lg font-bold text-nexus-success">{importReport.validQuestions.length}</span>
              </div>
              <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
                <span className="text-nexus-text-muted block">SCHEMA ERRORS</span>
                <span className="text-lg font-bold text-nexus-error">{importReport.errors.length}</span>
              </div>
            </div>

            {/* Error alerts if any */}
            {importReport.errors.length > 0 && (
              <div className="p-3 rounded bg-nexus-error/15 border border-nexus-error/30 max-h-40 overflow-y-auto space-y-1 text-xs text-nexus-error font-mono">
                <div className="font-bold mb-1">Validation Errors ({importReport.errors.length}):</div>
                {importReport.errors.map((err, idx) => (
                  <div key={idx}>
                    • {err.questionId ? `[${err.questionId}] ` : ''}{err.message}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings if any */}
            {importReport.warnings.length > 0 && (
              <div className="p-3 rounded bg-nexus-warning/15 border border-nexus-warning/30 max-h-32 overflow-y-auto space-y-1 text-xs text-nexus-warning font-mono">
                <div className="font-bold mb-1">Import Warnings ({importReport.warnings.length}):</div>
                {importReport.warnings.map((warn, idx) => (
                  <div key={idx}>• {warn}</div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-nexus-border">
              <span className="text-xs text-nexus-text-muted">
                {importReport.validQuestions.length > 0
                  ? `Ready to merge ${importReport.validQuestions.length} valid questions into local IndexedDB.`
                  : 'Cannot import: no valid questions found.'}
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isProcessingImport}
                  disabled={importReport.validQuestions.length === 0}
                  onClick={handleConfirmImport}
                >
                  Commit Import ({importReport.validQuestions.length})
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <Modal
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          title="Confirm Question Deletion"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-nexus-text-secondary leading-relaxed">
              Are you sure you want to permanently delete question <strong className="text-nexus-text">{deleteTargetId}</strong> from your local database? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteQuestion(deleteTargetId)}
              >
                Delete Question
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Restore Verified CDAC Bank"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> Restoring the default bank will re-seed all 7,783 official CDAC verified questions across all 4 CMCE modules from the verified archive and clear customized edits.
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsResetModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="cyan"
                size="sm"
                isLoading={isProcessingImport}
                onClick={handleResetToFactoryBank}
              >
                Restore Factory Bank
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
