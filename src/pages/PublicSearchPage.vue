<template>
  <q-page class="flex flex-center"
    style="background: linear-gradient(135deg, #663399 0%, #009999 100%); min-height: 100vh;">
    <q-card style="width: 800px; max-width: 95vw;">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h5">SIRRED - Búsqueda de Información</div>
        <div class="text-subtitle2">Universidad Técnica Privada Cosmos</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="searchByCI" class="q-mb-md">
          <div class="row q-gutter-md">
            <q-input v-model="ci" label="Ingrese su CI" outlined dense style="flex: 1"
              :rules="[val => !!val || 'CI es requerido']" />
            <q-btn type="submit" label="Buscar" color="primary" icon="search" :loading="searching" />
          </div>
        </q-form>

        <div v-if="noCorteActivo" class="text-center q-pa-md">
          <q-icon name="info" size="64px" color="warning" />
          <div class="text-h6 q-mt-md">No hay ningún corte activo en este momento</div>
          <div class="text-subtitle2">Por favor, contacte con el administrador</div>
        </div>

        <div v-else-if="searchResult">
          <q-card class="bg-primary text-white q-mb-md shadow-2">
            <q-card-section>
              <div class="row items-center no-wrap">
                <q-avatar size="64px" font-size="42px" color="white" text-color="primary" icon="person"
                  class="q-mr-md" />
                <div>
                  <div class="text-h6 text-weight-bold">{{ searchResult.docente.nombre }} {{
                    searchResult.docente.apellidos }}</div>
                  <div class="text-subtitle2 opacity-80">CI: {{ searchResult.docente.ci }}</div>
                  <div class="text-subtitle1 q-mt-sm">
                    <q-badge color="secondary" class="q-pa-xs text-body2">
                      {{ searchResult.corte_activo.nombre }}
                    </q-badge>
                  </div>
                  <div class="text-caption q-mt-xs text-italic opacity-80">
                    Periodo: {{ new Date(searchResult.corte_activo.fecha_inicio +
                      'T00:00:00').toLocaleDateString() }} -
                    {{ new Date(searchResult.corte_activo.fecha_fin +
                      'T00:00:00').toLocaleDateString() }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <div v-for="facturacion in searchResult.facturaciones" :key="facturacion.id" class="q-mb-md">
            <q-card bordered>
              <q-card-section class="bg-grey-2">
                <div class="row justify-between items-center">
                  <div>
                    <div class="text-subtitle1">
                      <strong>{{ facturacion.sede_carrera.sede.nombre }}</strong> - {{
                        facturacion.sede_carrera.carrera.nombre }}
                    </div>
                    <div class="text-caption">
                      Tipo: <q-badge :color="facturacion.tipo_contrato === 'FACTURACION' ? 'primary' : 'grey'">
                        {{ facturacion.tipo_contrato }}
                      </q-badge>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-h6">Bs. {{ facturacion.monto }}</div>
                    <div class="text-caption">Carga: {{ facturacion.carga_horaria }} hrs</div>
                  </div>
                </div>
              </q-card-section>

              <q-card-section v-if="facturacion.tipo_contrato === 'FACTURACION'">
                <div v-if="!facturacion.estado_subida || facturacion.estado_subida === 'DENEGADO'">
                  <q-banner v-if="facturacion.estado_subida === 'DENEGADO'" rounded
                    class="bg-red-1 text-red-9 q-mb-md border-red">
                    <template v-slot:avatar>
                      <q-icon name="error" color="red" />
                    </template>
                    <div class="text-weight-bold">Factura Denegada</div>
                    <div>Su factura fue denegada. Por favor, revise los requisitos y suba una nueva.
                    </div>
                    <div class="text-caption q-mt-xs" v-if="facturacion.fecha_subida">
                      Fecha de subida anterior: {{ new
                        Date(facturacion.fecha_subida).toLocaleDateString() }}
                    </div>
                  </q-banner>

                  <div class="row items-center q-col-gutter-md">
                    <div class="col-12 col-sm-8">
                      <q-file v-model="facturacion.file" label="Seleccionar Factura (PDF)" outlined dense accept=".pdf"
                        max-file-size="2097152" @rejected="onRejected">
                        <template v-slot:prepend>
                          <q-icon name="attach_file" />
                        </template>
                      </q-file>
                      <div class="text-caption text-grey-7 q-mt-xs">
                        Formato PDF, máx 2MB
                      </div>
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-btn label="Subir Factura" color="primary" icon="cloud_upload" class="full-width"
                        @click="uploadFactura(facturacion)" :loading="uploading[facturacion.id]"
                        :disable="!facturacion.file" />
                    </div>
                  </div>
                </div>

                <div v-else-if="facturacion.estado_subida === 'SUBIDA'">
                  <q-card flat bordered class="bg-blue-1 border-blue">
                    <q-card-section>
                      <div class="row items-center justify-between q-mb-md">
                        <div class="row items-center">
                          <q-icon name="cloud_upload" color="blue" size="32px" class="q-mr-md" />
                          <div>
                            <div class="text-subtitle1 text-weight-bold text-blue">
                              Factura Subida Correctamente
                            </div>
                            <div class="text-caption text-grey-8">
                              Registrada el {{ new Date(facturacion.fecha_subida).toLocaleDateString() }}
                            </div>
                          </div>
                        </div>
                        <q-btn flat round color="primary" icon="visibility" @click="viewFactura(facturacion)">
                          <q-tooltip>Ver Factura</q-tooltip>
                        </q-btn>
                      </div>

                      <q-banner class="bg-warning text-white q-mb-md" rounded>
                        <template v-slot:avatar>
                          <q-icon name="info" />
                        </template>
                        <div class="text-weight-bold">¿Necesita reemplazar su factura?</div>
                        <div class="text-caption">Si detectó un error, puede subir una nueva factura. La anterior será reemplazada.</div>
                      </q-banner>

                      <div class="row items-center q-col-gutter-md">
                        <div class="col-12 col-sm-8">
                          <q-file v-model="facturacion.file" label="Seleccionar Nueva Factura (PDF)" outlined dense
                            accept=".pdf" max-file-size="2097152" @rejected="onRejected">
                            <template v-slot:prepend>
                              <q-icon name="attach_file" />
                            </template>
                          </q-file>
                          <div class="text-caption text-grey-7 q-mt-xs">
                            Formato PDF, máx 2MB
                          </div>
                        </div>
                        <div class="col-12 col-sm-4">
                          <q-btn label="Reemplazar Factura" color="warning" icon="sync" class="full-width"
                            @click="confirmReplaceFactura(facturacion)" :loading="uploading[facturacion.id]"
                            :disable="!facturacion.file" />
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-else-if="facturacion.estado_subida === 'APROBADO'">
                  <q-card flat bordered class="bg-green-1 border-green">
                    <q-card-section class="row items-center justify-between">
                      <div class="row items-center">
                        <q-icon name="check_circle" color="positive" size="32px" class="q-mr-md" />
                        <div>
                          <div class="text-subtitle1 text-weight-bold text-positive">
                            Factura Aprobada
                          </div>
                          <div class="text-caption text-grey-8">
                            Registrada el {{ new Date(facturacion.fecha_subida).toLocaleDateString() }}
                          </div>
                          <div class="text-caption text-positive q-mt-xs">
                            <q-icon name="lock" size="xs" /> No se puede modificar una factura aprobada
                          </div>
                        </div>
                      </div>
                      <q-btn flat round color="primary" icon="visibility" @click="viewFactura(facturacion)">
                        <q-tooltip>Ver Factura</q-tooltip>
                      </q-btn>
                    </q-card-section>
                  </q-card>
                </div>
              </q-card-section>

              <q-card-section v-else>
                <q-banner class="bg-info text-white">
                  <template v-slot:avatar>
                    <q-icon name="info" />
                  </template>
                  Este tipo de contrato es solo informativo. No requiere subir factura.
                </q-banner>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>


    </q-card>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PublicSearchPage',
  setup() {
    const $q = useQuasar()
    const route = useRoute()
    const router = useRouter()
    const ci = ref('')
    const searching = ref(false)
    const searchResult = ref(null)
    const noCorteActivo = ref(false)
    const uploading = ref({})

    const searchByCI = async (refresh = false) => {
      searching.value = true
      if (!refresh) {
        searchResult.value = null
      }
      noCorteActivo.value = false

      try {
        // Update URL query param
        router.replace({ query: { ...route.query, ci: ci.value } })

        const response = await api.get('/public/search', {
          params: { ci: ci.value }
        })
        searchResult.value = response.data

        // Add file property to each facturacion for v-model
        searchResult.value.facturaciones.forEach(f => {
          f.file = null
        })
      } catch (error) {
        if (error.response?.status === 404) {
          const message = error.response.data.message
          if (message.includes('corte activo')) {
            noCorteActivo.value = true
          } else {
            $q.notify({ type: 'warning', message })
          }
        } else {
          $q.notify({ type: 'negative', message: 'Error al buscar' })
        }
      } finally {
        searching.value = false
      }
    }

    const uploadFactura = async (facturacion) => {
      if (!facturacion.file) return

      uploading.value[facturacion.id] = true
      try {
        const formData = new FormData()
        formData.append('factura', facturacion.file)

        await api.post(`/public/facturaciones/${facturacion.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        $q.notify({ type: 'positive', message: 'Factura subida correctamente' })

        // Refresh search
        searchByCI(true)
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Error al subir factura'
        })
      } finally {
        uploading.value[facturacion.id] = false
      }
    }

    const confirmReplaceFactura = (facturacion) => {
      $q.dialog({
        title: 'Confirmar Reemplazo',
        message: '¿Está seguro de que desea reemplazar su factura actual? La factura anterior será eliminada y deberá esperar una nueva revisión.',
        cancel: {
          label: 'Cancelar',
          color: 'grey',
          flat: true
        },
        ok: {
          label: 'Sí, Reemplazar',
          color: 'warning',
          flat: true
        },
        persistent: true
      }).onOk(() => {
        uploadFactura(facturacion)
      })
    }

    const onRejected = () => {
      $q.notify({
        type: 'negative',
        message: 'El archivo debe ser PDF y no superar 2MB'
      })
    }

    onMounted(() => {
      if (route.query.ci) {
        ci.value = route.query.ci
        searchByCI()
      }
    })

    return {
      ci,
      searching,
      searchResult,
      noCorteActivo,
      uploading,
      searchByCI,
      uploadFactura,
      confirmReplaceFactura,
      onRejected,
      viewFactura: (facturacion) => {
        if (!facturacion.factura_path) return
        // Get base URL and ensure it doesn't end with /api
        let baseUrl = api.defaults.baseURL
        if (baseUrl.endsWith('/api')) {
          baseUrl = baseUrl.slice(0, -4)
        }
        const url = `${baseUrl}/storage/${facturacion.factura_path}`
        window.open(url, '_blank')
      }
    }
  }
}
</script>
