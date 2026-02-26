import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Parameterised program routes — rendered on the server per request
  { path: 'programs/:programId',                           renderMode: RenderMode.Server },
  { path: 'programs/:programId/:sectionId',                renderMode: RenderMode.Server },
  { path: 'programs/:programId/:sectionId/:subSectionId',  renderMode: RenderMode.Server },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
