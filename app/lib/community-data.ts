// Shape of a tag option as returned by GET /api/tags.
export interface TagOption {
  id: number;
  slug: string;
  label: string;
  description: string | null;
}
