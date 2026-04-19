import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'home', redirectTo: '/gallery', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./features/profile/profile-edit/profile-edit.component').then((m) => m.ProfileEditComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'user/:id/followers',
    loadComponent: () =>
      import('./features/profile/followers/followers.component').then((m) => m.FollowersComponent),
  },
  {
    path: 'user/:id/following',
    loadComponent: () =>
      import('./features/profile/following/following.component').then((m) => m.FollowingComponent),
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./features/analysis/upload/upload.component').then((m) => m.UploadComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-analyses',
    loadComponent: () =>
      import('./features/analysis/my-analyses/my-analyses.component').then(
        (m) => m.MyAnalysesComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'my-paints',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/paint-inventory/paint-inventory.component').then(
        (m) => m.PaintInventoryComponent
      ),
  },
  {
    path: 'analyses',
    loadComponent: () =>
      import('./features/analysis/my-analyses/my-analyses.component').then(
        (m) => m.MyAnalysesComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'result/:id',
    loadComponent: () =>
      import('./features/analysis/result/result.component').then((m) => m.ResultComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-panel.component').then((m) => m.AdminPanelComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./features/ranking/ranking.component').then((m) => m.RankingComponent),
  },
  {
    path: 'challenges',
    loadComponent: () =>
      import('./features/challenges/challenges.component').then((m) => m.ChallengesComponent),
  },
  {
    path: 'challenges/:id',
    loadComponent: () =>
      import('./features/challenges/challenge-detail.component').then(
        (m) => m.ChallengeDetailComponent
      ),
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./features/gallery/post-list/post-list.component').then((m) => m.PostListComponent),
  },
  {
    path: 'posts/new',
    loadComponent: () =>
      import('./features/gallery/post-create/post-create.component').then(
        (m) => m.PostCreateComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'posts/:id/edit',
    loadComponent: () =>
      import('./features/gallery/post-create/post-create.component').then(
        (m) => m.PostCreateComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'posts/:id',
    loadComponent: () =>
      import('./features/gallery/post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent
      ),
  },
  {
    path: 'gallery/:id',
    loadComponent: () =>
      import('./features/gallery/post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent
      ),
  },
  { path: '**', redirectTo: '/gallery' },
];
