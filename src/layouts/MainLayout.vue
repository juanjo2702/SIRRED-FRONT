<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" style="box-shadow: 0 2px 8px rgba(0,0,0,0.1)">
      <q-toolbar class="q-py-sm">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" class="q-mr-sm" />

        <q-toolbar-title class="text-weight-medium">
          <div class="row items-center">
            <div
              style="background: white; padding: 4px 8px; border-radius: 8px; display: flex; align-items: center; margin-right: 12px;">
              <img src="/logo-unitepc.png" alt="UNITEPC" style="height: 28px; display: block;" />
            </div>
            <span>SIRRED</span>
          </div>
        </q-toolbar-title>

        <q-btn flat round dense icon="logout" @click="logout" class="q-ml-sm">
          <q-tooltip>Cerrar Sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above side="left" bordered :width="260" :breakpoint="1024"
      class="bg-grey-1" style="box-shadow: 2px 0 8px rgba(0,0,0,0.05)">
      <q-scroll-area class="fit">
        <q-list padding class="menu-list">
          <q-item-label header class="text-weight-bold text-grey-8 q-px-md q-pt-md q-pb-sm">
            Menú Principal
          </q-item-label>

          <q-item clickable v-ripple to="/" exact exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/users" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Usuarios</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/cortes" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="event" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Cortes</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/sedes" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="location_city" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Sedes</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/carreras" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="school" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Carreras</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/upload" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="upload_file" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Subir Datos</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/control" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="receipt" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Control de Facturas</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/control-afiliacion-retencion" exact-active-class="bg-primary text-white"
            class="q-mx-sm q-mb-xs rounded-borders">
            <q-item-section avatar>
              <q-icon name="assignment" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Afiliación y Retención</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'MainLayout',
  setup() {
    const leftDrawerOpen = ref(true)
    const router = useRouter()

    const toggleLeftDrawer = () => {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    const logout = () => {
      localStorage.removeItem('token')
      router.push('/login')
    }

    return {
      leftDrawerOpen,
      toggleLeftDrawer,
      logout
    }
  }
}
</script>

<style scoped>
.menu-list .q-item {
  transition: all 0.2s ease;
}

.menu-list .q-item:hover:not(.q-router-link--exact-active) {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-list .q-item.q-router-link--exact-active {
  font-weight: 500;
}
</style>
