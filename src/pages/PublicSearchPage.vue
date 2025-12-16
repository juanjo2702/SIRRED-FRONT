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
                    Periodo: {{ formatDateDisplay(searchResult.corte_activo.fecha_inicio) }} -
                    {{ formatDateDisplay(searchResult.corte_activo.fecha_fin) }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Banner Periodo de Facturación -->
          <q-banner v-if="searchResult.periodo_facturacion?.fecha_inicio" rounded class="q-mb-md" :class="getPeriodoBannerClass()">
            <template v-slot:avatar>
              <q-icon :name="getPeriodoIcon()" />
            </template>
            <div class="text-weight-bold">{{ getPeriodoTitle() }}</div>
            <div>Periodo: {{ formatDate(searchResult.periodo_facturacion.fecha_inicio) }} - {{ formatDate(searchResult.periodo_facturacion.fecha_fin) }}</div>
            <div v-if="searchResult.periodo_facturacion.estado === 'abierto' && searchResult.periodo_facturacion.dias_restantes !== null" class="text-caption q-mt-xs">
              <q-icon name="schedule" size="xs" /> {{ searchResult.periodo_facturacion.dias_restantes }} día(s) restantes para subir su factura
            </div>
          </q-banner>

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
                <!-- Estado REZAGADO -->
                <q-banner v-if="facturacion.estado_subida === 'REZAGADO'" rounded class="bg-orange-1 text-orange-9 q-mb-md">
                  <template v-slot:avatar>
                    <q-icon name="schedule" color="orange" />
                  </template>
                  <div class="text-weight-bold">Factura Rezagada</div>
                  <div>No subió su factura dentro del periodo establecido. Aún puede subirla ahora.</div>
                </q-banner>

                <!-- Periodo Cerrado (no es rezagado) -->
                <q-banner v-if="searchResult.periodo_facturacion?.estado === 'cerrado' && !facturacion.estado_subida" rounded class="bg-red-1 text-red-9 q-mb-md">
                  <template v-slot:avatar>
                    <q-icon name="block" color="red" />
                  </template>
                  <div class="text-weight-bold">Periodo de Facturación Cerrado</div>
                  <div>El plazo para subir facturas ha terminado. Contacte al administrador.</div>
                </q-banner>

                <div v-if="(!facturacion.estado_subida && searchResult.periodo_facturacion?.estado !== 'cerrado') || facturacion.estado_subida === 'DENEGADO' || facturacion.estado_subida === 'REZAGADO' || facturacion.estado_subida === 'RECHAZADO'">
                  <!-- Banner para DENEGADO (administrador) -->
                  <q-banner v-if="facturacion.estado_subida === 'DENEGADO'" rounded
                    class="bg-red-1 text-red-9 q-mb-md border-red">
                    <template v-slot:avatar>
                      <q-icon name="error" color="red" />
                    </template>
                    <div class="text-weight-bold">Factura Denegada por Administrador</div>
                    <div>Su factura fue denegada. Por favor, revise los requisitos y suba una nueva.
                    </div>
                    <div class="text-caption q-mt-xs" v-if="facturacion.fecha_subida">
                      Fecha de subida anterior: {{ new
                        Date(facturacion.fecha_subida).toLocaleDateString() }}
                    </div>
                  </q-banner>

                  <!-- Banner para RECHAZADO (validación automática) -->
                  <q-banner v-if="facturacion.estado_subida === 'RECHAZADO'" rounded
                    class="bg-orange-1 text-orange-9 q-mb-md">
                    <template v-slot:avatar>
                      <q-icon name="warning" color="orange" />
                    </template>
                    <div class="text-weight-bold">Factura Rechazada - Errores de Validación</div>
                    <div class="q-mt-sm" v-if="facturacion.errores_validacion?.length">
                      <div v-for="(error, idx) in facturacion.errores_validacion" :key="idx" class="q-mb-xs">
                        • {{ error }}
                      </div>
                    </div>
                    <div class="text-caption q-mt-sm">
                      <q-icon name="refresh" size="xs" /> Intentos: {{ facturacion.intentos_validacion || 0 }} / 3
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

        const response = await api.post(`/public/facturaciones/${facturacion.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        // Verificar el estado de la respuesta
        const data = response.data

        if (data.estado === 'APROBADO') {
          $q.notify({
            type: 'positive',
            message: data.message,
            timeout: 5000
          })
        } else if (data.estado === 'SUBIDA' && data.validacion?.errores?.length > 0) {
          // Pendiente de revisión manual
          $q.dialog({
            title: '⚠️ Factura en Revisión',
            message: data.message + '\n\nSu factura será revisada manualmente por un administrador.',
            ok: 'Entendido'
          })
        } else {
          $q.notify({
            type: 'positive',
            message: data.message || 'Factura subida correctamente',
            timeout: 3000
          })
        }

        // Refresh search
        searchByCI(true)
      } catch (error) {
        const errorData = error.response?.data

        // Error 422 = Error de validación (factura rechazada)
        if (error.response?.status === 422 && errorData?.validacion) {
          const errores = errorData.validacion.errores || []
          const intentosRestantes = errorData.validacion.intentos_restantes || 0

          $q.dialog({
            title: '❌ Factura Rechazada',
            message: `Su factura no cumple con los requisitos:\n\n${errores.map((e, i) => `${i+1}. ${e}`).join('\n')}\n\n` +
                     (intentosRestantes > 0
                       ? `Le quedan ${intentosRestantes} intento(s). Por favor, corrija su factura y vuelva a subirla.`
                       : 'Ha agotado sus intentos. La factura será enviada a revisión manual.'),
            html: true,
            ok: {
              label: 'Entendido',
              color: 'primary'
            }
          })
        } else {
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Error al subir factura'
          })
        }
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

    const formatDate = (dateString) => {
      if (!dateString) return ''
      let date
      if (dateString.includes('T')) {
        date = new Date(dateString)
      } else {
        date = new Date(dateString + 'T00:00:00')
      }
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('es-BO')
    }

    const formatDateDisplay = (dateString) => {
      if (!dateString) return ''
      let date
      if (typeof dateString === 'string' && dateString.includes('T')) {
        date = new Date(dateString)
      } else {
        date = new Date(dateString + 'T00:00:00')
      }
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('es-BO')
    }

    const getPeriodoBannerClass = () => {
      const estado = searchResult.value?.periodo_facturacion?.estado
      if (estado === 'abierto') return 'bg-green-1 text-green-9'
      if (estado === 'cerrado') return 'bg-red-1 text-red-9'
      return 'bg-grey-3 text-grey-8'
    }

    const getPeriodoIcon = () => {
      const estado = searchResult.value?.periodo_facturacion?.estado
      if (estado === 'abierto') return 'check_circle'
      if (estado === 'cerrado') return 'block'
      return 'schedule'
    }

    const getPeriodoTitle = () => {
      const estado = searchResult.value?.periodo_facturacion?.estado
      if (estado === 'abierto') return 'Periodo de Facturación Abierto'
      if (estado === 'cerrado') return 'Periodo de Facturación Cerrado'
      return 'Periodo de Facturación Pendiente'
    }

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
      formatDate,
      formatDateDisplay,
      getPeriodoBannerClass,
      getPeriodoIcon,
      getPeriodoTitle,
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
