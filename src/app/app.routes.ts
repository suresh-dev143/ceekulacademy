import { Routes } from '@angular/router';
import { LandingLayout } from './components/landing-layout/landing-layout';
import { Landing } from './pages/landing/landing';
import { PersonalLayout } from './components/personal-layout/personal-layout';
import { AdminLayout } from './components/admin-layout/admin-layout';
import { Create } from './pages/personal/create/create';
import { Demand } from './pages/personal/demand/demand';
import { Edit } from './pages/personal/edit/edit';
import { Future } from './pages/personal/future/future';
import { Kutumb } from './pages/personal/kutumb/kutumb';
import { Neurons } from './pages/personal/neurons/neurons';
import { Potential } from './pages/personal/potential/potential';
import { Projects } from './pages/personal/projects/projects';
import { Supply } from './pages/personal/supply/supply';
import { Register } from './pages/register copy/register';

export const routes: Routes = [
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard-home').then(m => m.DashboardHomeComponent) },
  { path: 'dashboard/courses', loadComponent: () => import('./pages/courses/courses').then(m => m.CoursesComponent) },
  { path: 'dashboard/director', loadComponent: () => import('./pages/director-dashboard/director-dashboard').then(m => m.DirectorDashboardComponent) },
  { path: 'dashboard/partner', loadComponent: () => import('./pages/partner-dashboard/partner-dashboard').then(m => m.PartnerDashboardComponent) },
  { path: 'dashboard/student', loadComponent: () => import('./pages/student-dashboard/student-dashboard').then(m => m.StudentDashboardComponent) },
  { path: 'dashboard/student/nearby', loadComponent: () => import('./pages/student-nearby/student-nearby').then(m => m.StudentNearbyComponent) },
  { path: 'dashboard/teacher', loadComponent: () => import('./pages/teacher-dashboard/teacher-dashboard').then(m => m.TeacherDashboardComponent) },
  { path: 'about', loadComponent: () => import('./pages/about/about').then(m => m.AboutComponent) } ,
   { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact').then(m => m.ContactPageComponent) },
  { path: 'district', loadComponent: () => import('./pages/district/district').then(m => m.DistrictComponent) },
  { path: 'issues', loadComponent: () => import('./pages/issues/issues').then(m => m.IssuesPageComponent) },
  { path: 'donate', loadComponent: () => import('./pages/donate/donate').then(m => m.DonatePageComponent) },
  { path: 'invest', loadComponent: () => import('./pages/invest/invest').then(m => m.InvestPageComponent) },
  { path: 'innovative', loadComponent: () => import('./pages/innovative/innovative').then(m => m.InnovativeComponent) },
  { path: 'courses', loadComponent: () => import('./pages/innovative/innovative').then(m => m.InnovativeComponent) },

  { path: 'transformation', loadComponent: () => import('./pages/transformation/transformation').then(m => m.TransformationComponent) },
  { path: 'centers', loadComponent: () => import('./pages/centers/centers').then(m => m.CentersComponent) },
  { path: 'health-connect', loadComponent: () => import('./pages/health-connect/health-connect').then(m => m.HealthConnectComponent) },
  { path: 'my-schedule', loadComponent: () => import('./pages/my-schedule/my-schedule').then(m => m.MyScheduleComponent) },
  { path: 'my-profile', loadComponent: () => import('./pages/my-profile/my-profile').then(m => m.MyProfileComponent) },
  { path: 'research/new', loadComponent: () => import('./pages/research/research-new/research-new').then(m => m.ResearchNewComponent) },
  { path: 'research', loadComponent: () => import('./pages/research/research').then(m => m.ResearchPageComponent) },
  // ==================== AD PLATFORM ====================
  { path: 'dashboard/advertiser', redirectTo: '/personal/advertise', pathMatch: 'full' },
  { path: 'lectures/:lectureId/watch', loadComponent: () => import('./pages/lecture-watch/lecture-watch').then(m => m.LectureWatchComponent) },
  { path: 'lectures/:lectureId/edit', loadComponent: () => import('./pages/live-editor/live-editor').then(m => m.LiveEditorComponent) },
  { path: 'lectures/:lectureId/chat', loadComponent: () => import('./pages/lecture-chat/lecture-chat').then(m => m.LectureChatComponent) },
  // ==================== AI / ADAPTIVE CONTENT ====================
  { path: 'dashboard/digital-twin', loadComponent: () => import('./pages/digital-twin-dashboard/digital-twin-dashboard').then(m => m.DigitalTwinDashboardComponent) },
  { path: 'dashboard/innovation', loadComponent: () => import('./pages/innovation-pipeline/innovation-pipeline').then(m => m.InnovationPipelineComponent) },
  // ==================== ADAPTIVE CONTENT ENGINE ====================
  { path: 'learn', redirectTo: 'learn/default', pathMatch: 'full' },
  { path: 'learn/:topicId', loadComponent: () => import('./pages/adaptive-content/adaptive-content').then(m => m.AdaptiveContentComponent) },
  { path: 'interactive-learning', loadComponent: () => import('./components/orchestration/split-screen-layout.component').then(m => m.SplitScreenLayoutComponent) },
  // ==================== NEURON PARTICIPATION HUB ====================
  { path: 'neurons', loadComponent: () => import('./pages/neuron-hub/neuron-hub').then(m => m.NeuronHubComponent) },

  // ==================== PAYMENT RETURN (Cramib redirect-back) ====================
  { path: 'payment/return', loadComponent: () => import('./pages/payment-return/payment-return').then(m => m.PaymentReturn) },

  // Registration — standalone full-page layout (not wrapped in PersonalLayout)
  { path: 'register', component: Register },
   { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },

  {
    path: '',
    component: LandingLayout,
    children: [
      { path: '', component: Landing }
    ]
  },
  {
    path: 'personal',
    component: PersonalLayout,
    children: [
      { path: '', redirectTo: 'my-activities', pathMatch: 'full' },
     

      { path: 'dashboard/teacher/workshops', redirectTo: 'dashboard/my-workshops', pathMatch: 'full' },
      { path: 'dashboard/my-workshops', loadComponent: () => import('./pages/workshops/my-workshops/my-workshops').then(m => m.MyWorkshopsComponent) },
      { path: 'dashboard/enrolled-workshops', loadComponent: () => import('./pages/workshops/enrolled-workshops/enrolled-workshops').then(m => m.EnrolledWorkshopsComponent) },

      { path: 'workshops', loadComponent: () => import('./pages/workshops/workshops').then(m => m.PublicWorkshopsPageComponent) },
      { path: 'workshops/:workshopId/live/:scheduleId', loadComponent: () => import('./pages/workshops/live-room/live-room').then(m => m.LiveRoomComponent) },

      // Left sidebar routes
      { path: 'programs', loadComponent: () => import('./pages/programs/programs').then(m => m.ProgramsComponent) },
      { path: 'programs/:programId', loadComponent: () => import('./pages/program-detail/program-detail').then(m => m.ProgramDetailComponent) },
      { path: 'programs/:programId/:sectionId', loadComponent: () => import('./pages/program-detail/program-detail').then(m => m.ProgramDetailComponent) },
      { path: 'programs/:programId/:sectionId/:subSectionId', loadComponent: () => import('./pages/program-detail/program-detail').then(m => m.ProgramDetailComponent) },
      {
        path: 'my-activities',
        loadComponent: () => import('./pages/personal/my-activities/my-activites').then(m => m.MyActivities),
        data: { leftSidebar: 'meta' },
      },
      { path: 'set-my-content', loadComponent: () => import('./pages/personal/my-activities/set-my-content/set-my-content').then(m => m.SetMyContent),   data: { leftSidebar: 'meta' } },
      { path: 'past-content',   loadComponent: () => import('./pages/personal/my-activities/past-content/past-content').then(m => m.PastContent),         data: { leftSidebar: 'meta' } },
      { path: 'potential', component: Potential },
      { path: 'projects', component: Projects },
      { path: 'neurons', component: Neurons },
      { path: 'kutumb', component: Kutumb },
      { path: 'future', component: Future },
      { path: 'digital-life', loadComponent: () => import('./pages/personal/digital-life/digital-life').then(m => m.DigitalLife) },
      { path: 'human-life', loadComponent: () => import('./pages/personal/human-life/human-life').then(m => m.HumanLife) },
      // Action Hub — unified create / offer / advertise / explore
      // { path: 'action-hub', loadComponent: () => import('./pages/personal/action-hub/action-hub').then(m => m.ActionHub) },
      // Top navbar routes
      { path: 'create', component: Create, data: { leftSidebar: 'contextual' } },
      { path: 'create/:pageId', component: Create, data: { leftSidebar: 'contextual' } },
      { path: 'advertise', loadComponent: () => import('./pages/advertiser-dashboard/advertiser-dashboard').then(m => m.AdvertiserDashboardComponent) },
      { path: 'demand', component: Demand },
      { path: 'supply', component: Supply },
      { path: 'edit', component: Edit },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact').then(m => m.ContactPageComponent) },
      { path: 'local-news', loadComponent: () => import('./pages/personal/local-news/local-news').then(m => m.LocalNewsPage) },
      { path: 'ai-tools', loadComponent: () => import('./pages/personal/ai-tools/ai-tools').then(m => m.AiToolsPage) },
      { path: 'library', loadComponent: () => import('./pages/personal/library/library').then(m => m.LibraryComponent), data: { leftSidebar: 'contextual' } },
    ]
  },

  // ==================== CUAP — ADMIN PANEL ====================
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'command', pathMatch: 'full' },
      { path: 'command',  loadComponent: () => import('./pages/admin/command-center/command-center').then(m => m.CommandCenter) },
      { path: 'homepage', loadComponent: () => import('./pages/admin/homepage-engine/homepage-engine').then(m => m.HomepageEngine) },
      { path: 'content',  loadComponent: () => import('./pages/admin/content-mod/content-mod').then(m => m.ContentMod) },
      { path: 'cid',      loadComponent: () => import('./pages/admin/cid-explorer/cid-explorer').then(m => m.CidExplorer) },
      { path: 'ads',      loadComponent: () => import('./pages/admin/ad-manager/ad-manager').then(m => m.AdManager) },
      { path: 'users',    loadComponent: () => import('./pages/admin/user-mgmt/user-mgmt').then(m => m.UserMgmt) },
      { path: 'analytics',loadComponent: () => import('./pages/admin/analytics/analytics').then(m => m.Analytics) },
      { path: 'infra',    loadComponent: () => import('./pages/admin/infra/infra').then(m => m.Infra) },
      { path: 'identity', loadComponent: () => import('./pages/admin/identity/identity').then(m => m.Identity) },
      { path: 'settings', loadComponent: () => import('./pages/admin/settings/settings').then(m => m.Settings) },
    ]
  },

  { path: '**', redirectTo: '' },
];
