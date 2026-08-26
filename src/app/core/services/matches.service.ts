import {
    Injectable,
    inject
  } from '@angular/core';
  
  import {
    HttpClient,
    HttpParams
  } from '@angular/common/http';
  
  import {
    Observable
  } from 'rxjs';
  
  import {
    environment
  } from '../../../environments/environment';
  
  import {
    Match,
    MatchesResponse,
    MatchStatus,
    CreateMatchPayload,
    UpdateMatchPayload,
    MatchEventPayload
  } from '../../shared/models/match.model';
  
  @Injectable({
    providedIn: 'root'
  })
  export class MatchesService {
  
    private readonly http = inject(HttpClient);
  
    private readonly endpoint =
      `${environment.apiUrl}/api/matches`;
  
  
    // =========================================================
    // LIST
    // =========================================================
  
    getMatches(
      search = '',
      status?: MatchStatus,
      page = 1,
      limit = 10
    ): Observable<MatchesResponse> {
  
      let params = new HttpParams()
        .set('page', page)
        .set('limit', limit);
  
      if (search.trim()) {
        params = params.set(
          'search',
          search.trim()
        );
      }
  
      if (status) {
        params = params.set(
          'status',
          status
        );
      }
  
      return this.http.get<MatchesResponse>(
        this.endpoint,
        { params }
      );
    }
  
  
    // =========================================================
    // CREATE
    // =========================================================
  
    createMatch(
      payload: CreateMatchPayload
    ): Observable<Match> {
  
      return this.http.post<Match>(
        this.endpoint,
        payload
      );
    }
  
  
    // =========================================================
    // GET
    // =========================================================
  
    getMatch(
      id: string
    ): Observable<Match> {
  
      return this.http.get<Match>(
        `${this.endpoint}/${id}`
      );
    }
  
  
    // =========================================================
    // UPDATE
    // =========================================================
  
    updateMatch(
      id: string,
      payload: UpdateMatchPayload
    ): Observable<Match> {
  
      return this.http.patch<Match>(
        `${this.endpoint}/${id}`,
        payload
      );
    }
  
  
    // =========================================================
    // DELETE
    // =========================================================
  
    deleteMatch(
      id: string
    ): Observable<unknown> {
  
      return this.http.delete(
        `${this.endpoint}/${id}`
      );
    }
  
  
    // =========================================================
    // STATUS
    // =========================================================
  
    updateStatus(
      id: string,
      status: MatchStatus
    ): Observable<unknown> {
  
      return this.http.patch(
        `${this.endpoint}/${id}/status`,
        { status }
      );
    }
  
  
    // =========================================================
    // EVENTS
    // =========================================================
  
    addEvent(
      id: string,
      payload: MatchEventPayload
    ): Observable<unknown> {
  
      return this.http.post(
        `${this.endpoint}/${id}/events`,
        payload
      );
    }
  
  
    // =========================================================
    // SCOREBOARD
    // =========================================================
  
    getScoreboard(
      id: string
    ): Observable<unknown> {
  
      return this.http.get(
        `${this.endpoint}/${id}/scoreboard`
      );
    }
  
  
    // =========================================================
    // TIMELINE
    // =========================================================
  
    getTimeline(
      id: string
    ): Observable<unknown> {
  
      return this.http.get(
        `${this.endpoint}/${id}/timeline`
      );
    }
  
  
    // =========================================================
    // STATS
    // =========================================================
  
    getStats(
      id: string
    ): Observable<unknown> {
  
      return this.http.get(
        `${this.endpoint}/${id}/stats`
      );
    }
  
  }
  