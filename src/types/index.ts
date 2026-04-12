// ── Database row types ────────────────────────────────────────

export type College = {
  id: string;
  name: string;
  city: string;
  state: string;
  approved: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  college_id: string | null;
  branch: string | null;
  year: number | null;
  section: string | null;
  role: "cr" | "announcer" | null;
  granted_by: string | null;
  dark_mode: boolean;
  created_at: string;
};

export type SourceTag = "principal" | "dean" | "college" | "cr" | "announcer";

export type Announcement = {
  id: string;
  college_id: string;
  branch: string;
  year: number;
  section: string;
  author_id: string;
  body: string;
  source_tag: SourceTag;
  is_pinned: boolean;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  // joined
  author?: Pick<Profile, "id" | "full_name" | "role">;
};

export type DateType = "exam" | "submission" | "event";

export type ImportantDate = {
  id: string;
  college_id: string;
  branch: string;
  year: number;
  section: string;
  author_id: string;
  title: string;
  description: string | null;
  date: string;
  type: DateType;
  created_at: string;
};

export type MaterialType = "notes" | "past_paper" | "slides" | "summary";

export type Material = {
  id: string;
  college_id: string;
  branch: string;
  year: number;
  subject: string | null;
  title: string;
  type: MaterialType;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploader_id: string | null;
  uploader_name: string;
  upvotes: number;
  approved: boolean;
  created_at: string;
};

// ── UI / filter types ────────────────────────────────────────

export type ClassFilter = {
  collegeId: string;
  branch: string;
  year: number;
  section: string;
};

export type FeedTab = "all" | "announcement" | "material";

export type Theme = "light" | "dark";
