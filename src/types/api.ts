// TypeScript type definitions for API responses

export interface Project {
  id: number;
  title: string;
  description: string;
  repoUrl?: string | null;
  nftBadgeUrl?: string | null;
  ipfs: {
    cid?: string | null;
    url?: string | null;
    pinned: boolean;
    name?: string | null;
    size?: number | null;
  };
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds
}

export interface Settings {
  displayName: string;
}

// API Response Types
export type ProjectListResponse = Project[];
export type ProjectSingleResponse = Project;
export type ProjectCreateResponse = Project;
export type ProjectUpdateResponse = Project;
export interface ProjectDeleteResponse {
  message: string;
  project: {
    id: number;
    title: string;
  };
}

export type SettingsResponse = Settings;

// Request body types
export interface CreateProjectRequest {
  title: string;
  description: string;
  repoUrl?: string;
  nftBadgeUrl?: string;
  ipfsCid?: string;
  ipfsUrl?: string;
  ipfsPinned?: boolean;
  assetName?: string;
  assetSize?: number;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  repoUrl?: string | null;
  nftBadgeUrl?: string | null;
  ipfsCid?: string | null;
  ipfsUrl?: string | null;
  ipfsPinned?: boolean;
  assetName?: string | null;
  assetSize?: number | null;
}

export interface UpdateSettingsRequest {
  displayName: string;
}

// Error response type
export interface ErrorResponse {
  error: string;
  code?: string;
}