export interface Sport {
    id: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
  }
  
  export interface SportsMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  export interface SportsResponse {
    success: boolean;
    data: Sport[];
    meta: SportsMeta;
  }
  
  export interface SportPayload {
    name: string;
    description?: string;
    iconUrl?: string;
  }
  