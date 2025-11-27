const routes = [
  {
    path: '/login',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') }
    ]
  },
  {
    path: '/search',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      { path: '', component: () => import('pages/PublicSearchPage.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'users', component: () => import('pages/UsersPage.vue') },
      { path: 'cortes', component: () => import('pages/CortesPage.vue') },
      { path: 'sedes', component: () => import('pages/SedesPage.vue') },
      { path: 'carreras', component: () => import('pages/CarrerasPage.vue') },
      { path: 'upload', component: () => import('pages/UploadPage.vue') },
      { path: 'control', component: () => import('pages/ControlPage.vue') },
      { path: 'control-afiliacion-retencion', component: () => import('pages/AffiliationRetentionPage.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
