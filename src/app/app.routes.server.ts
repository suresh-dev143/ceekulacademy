import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Parameterised program routes — rendered on the server per request
  { path: 'personal/programs/:programId',                           renderMode: RenderMode.Server },
  { path: 'personal/programs/:programId/:sectionId',                renderMode: RenderMode.Server },
  { path: 'personal/programs/:programId/:sectionId/:subSectionId',  renderMode: RenderMode.Server },
  // Parameterised workshop live routes — rendered on the server per request
  { path: 'personal/workshops/:workshopId/live/:scheduleId', renderMode: RenderMode.Server },
  // Canvas editor with draft ID — rendered client-side (draft in localStorage)
  { path: 'personal/create/:pageId', renderMode: RenderMode.Client },
  // CG Page — parameterised, render on-demand (CG IDs are not known at build time)
  { path: 'cg/:cgId', renderMode: RenderMode.Server },
  // Auth-gated personal routes — skip SSR (require live API + auth token)
  { path: 'personal/library',                             renderMode: RenderMode.Client },
  { path: 'personal/my-annotations',                      renderMode: RenderMode.Client },
  { path: 'personal/schedule',                             renderMode: RenderMode.Client },
  { path: 'personal/enrol',                               renderMode: RenderMode.Client },
  { path: 'personal/welfare',                             renderMode: RenderMode.Client },
  // Auth-gated dashboard routes — skip SSR (require live API + auth token)
  { path: 'dashboard/advertiser',                          renderMode: RenderMode.Client },
  { path: 'lectures/:lectureId/watch',                     renderMode: RenderMode.Client },
  { path: 'lectures/:lectureId/edit',                      renderMode: RenderMode.Client },
  { path: 'lectures/:lectureId/chat',                      renderMode: RenderMode.Client },
  { path: 'learn/:topicId',                                renderMode: RenderMode.Client },
  { path: 'content/share/:token',                         renderMode: RenderMode.Client },
  { path: 'content/:baseId',                              renderMode: RenderMode.Client },
  { path: 'dashboard/digital-twin',                        renderMode: RenderMode.Client },
  { path: 'dashboard/innovation',                          renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
