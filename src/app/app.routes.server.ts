import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Parameterised program routes — rendered on the server per request
  { path: 'programs/:programId',                           renderMode: RenderMode.Server },
  { path: 'programs/:programId/:sectionId',                renderMode: RenderMode.Server },
  { path: 'programs/:programId/:sectionId/:subSectionId',  renderMode: RenderMode.Server },
  // Parameterised workshop live routes — rendered on the server per request
  { path: 'workshops/:workshopId/live/:scheduleId',        renderMode: RenderMode.Server },
  // Auth-gated dashboard routes — skip SSR (require live API + auth token)
  { path: 'dashboard/advertiser',                          renderMode: RenderMode.Client },
  { path: 'lectures/:lectureId/watch',                     renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
