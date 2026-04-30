export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "recruiter" | "admin";
}

export interface Resume {
  id: string;
  label: string;
  filename: string;
  name: string;
  email: string;
  skills: string[];
  experience_years: number;
  education: string;
  is_default: boolean;
  created_at?: string | null;
}

export interface MatchBreakdown {
  required_skill_score: number;
  preferred_skill_score: number;
  experience_score: number;
  semantic_score: number;
}

export interface JobMatch {
  job_id: string;
  job_title: string;
  company: string;
  resume_id: string;
  resume_label: string;
  match_score: number;
  skill_match_percent: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  breakdown: MatchBreakdown;
  ai_explanation: string;
  improvement_tips: string[];
  status: string;
  applied_at?: string | null;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description?: string;
  required_skills: string[];
  preferred_skills?: string[];
  min_experience: number;
  location: string;
  salary_range: string;
  job_type: string;
  status: string;
  created_by: string;
  application_count: number;
  has_applied?: boolean;
  my_match_score?: number | null;
  my_application?: JobMatch | null;
  created_at?: string | null;
}

export interface JobCandidate {
  id: string;
  user_id: string;
  resume_id: string;
  resume_label: string;
  name: string;
  email: string;
  skills: string[];
  experience_years: number;
  education: string;
  match_score: number;
  skill_match_percent: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  breakdown: MatchBreakdown;
  ai_summary: string;
  ai_explanation: string;
  status: string;
  applied_at?: string | null;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  default_resume_id: string | null;
  default_resume_label: string | null;
  resume_count: number;
  skills: string[];
  experience_years: number;
  education: string;
  ai_summary: string;
  total_applications: number;
}

export interface CandidateInsights {
  top_skills: string[];
  skill_gaps: string[];
  avg_match_score: number;
  best_match_job: string | null;
  career_tips: string[];
  skill_gap_analysis: {
    overall_coverage: number;
    matched_required: string[];
    missing_required: string[];
    matched_preferred: string[];
    missing_preferred: string[];
    extra_skills: string[];
  };
}
