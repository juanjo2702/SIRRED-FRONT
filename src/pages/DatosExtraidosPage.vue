<template>
  <q-page padding>
    <div class="q-mb-md">
      <div class="text-h5 text-weight-medium">
        <q-icon name="analytics" class="q-mr-sm" />
        Datos Extraídos de Facturas
      </div>
      <div class="text-caption text-grey-7">
        Visualice los datos extraídos automáticamente de los PDFs de facturas
      </div>
    </div>

    <!-- Filtros -->
    <q-card class="q-mb-md shadow-2" flat bordered>
      <q-card-section class="bg-grey-2">
        <div class="text-subtitle1 text-grey-8">Filtros</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="selectedCorte" :options="cortes" option-label="nombre" option-value="id" label="Corte"
              outlined dense @update:model-value="onCorteChange">
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="selectedSede" :options="sedeOptions" label="Sede" outlined dense emit-value map-options
              clearable @update:model-value="onSedeChange">
              <template v-slot:prepend>
                <q-icon name="location_on" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="selectedCarrera" :options="carreraOptions" label="Carrera" outlined dense emit-value
              map-options clearable :disable="!selectedSede">
              <template v-slot:prepend>
                <q-icon name="school" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-input v-model="searchQuery" outlined dense placeholder="Buscar por docente, NIT o razón social..."
              clearable>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Estadísticas -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-primary text-white">
          <q-card-section class="row items-center no-wrap">
            <q-icon name="description" size="40px" class="q-mr-md" />
            <div>
              <div class="text-h5 text-weight-bold">{{ filteredDatos.length }}</div>
              <div class="text-caption">Total Extraídos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-positive text-white">
          <q-card-section class="row items-center no-wrap">
            <q-icon name="check_circle" size="40px" class="q-mr-md" />
            <div>
              <div class="text-h5 text-weight-bold">{{ datosCompletos }}</div>
              <div class="text-caption">Datos Completos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-warning text-white">
          <q-card-section class="row items-center no-wrap">
            <q-icon name="warning" size="40px" class="q-mr-md" />
            <div>
              <div class="text-h5 text-weight-bold">{{ montosDiferentes }}</div>
              <div class="text-caption">Montos Diferentes</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-orange text-white">
          <q-card-section class="row items-center no-wrap">
            <q-icon name="schedule" size="40px" class="q-mr-md" />
            <div>
              <div class="text-h5 text-weight-bold">{{ filteredRezagados.length }}</div>
              <div class="text-caption">Rezagados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Botón de Exportación -->
    <div class="row justify-end q-mb-md">
      <q-btn color="positive" icon="download" label="Exportar Aprobados" unelevated @click="exportDatosExtraidos"
        :disable="datos.length === 0">
        <q-tooltip>Solo exporta facturas con estado APROBADO (FECHA, NroFACTURA, NIT, CUF, NOMBRE, Monto)</q-tooltip>
      </q-btn>
    </div>

    <!-- Tabla -->
    <q-card flat bordered class="shadow-2">
      <q-table :rows="filteredDatos" :columns="columns" row-key="id" :loading="loading" flat
        :rows-per-page-options="[10, 25, 50]">
        <!-- Docente -->
        <template v-slot:body-cell-docente="props">
          <q-td :props="props">
            <div>
              <div class="text-weight-bold">
                {{ props.row.docente?.apellidos }} {{ props.row.docente?.nombre }}
              </div>
              <div class="text-caption text-grey-7">
                CI: {{ props.row.docente?.ci }}
              </div>
            </div>
          </q-td>
        </template>

        <!-- Datos Extraídos -->
        <template v-slot:body-cell-nit_emisor="props">
          <q-td :props="props">
            <q-chip :color="props.row.datos_extraidos?.nit_emisor ? 'primary' : 'grey'" text-color="white" size="sm"
              dense>
              {{ props.row.datos_extraidos?.nit_emisor || 'N/A' }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-razon_social="props">
          <q-td :props="props">
            <div class="ellipsis" style="max-width: 200px;">
              {{ props.row.datos_extraidos?.razon_social || '-' }}
              <q-tooltip v-if="props.row.datos_extraidos?.razon_social">
                {{ props.row.datos_extraidos?.razon_social }}
              </q-tooltip>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-numero_factura="props">
          <q-td :props="props" class="text-center">
            <q-badge color="secondary">
              #{{ props.row.datos_extraidos?.numero_factura || 'N/A' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-fecha_factura="props">
          <q-td :props="props" class="text-center">
            {{ props.row.datos_extraidos?.fecha_factura || '-' }}
          </q-td>
        </template>

        <!-- Comparación de Montos -->
        <template v-slot:body-cell-montos="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <div class="column items-end q-mr-sm">
                <div class="text-caption text-grey-6">Excel</div>
                <div class="text-weight-medium">Bs {{ props.row.monto_excel }}</div>
              </div>
              <q-icon :name="montosCoinciden(props.row) ? 'check_circle' : 'warning'"
                :color="montosCoinciden(props.row) ? 'positive' : 'warning'" size="sm" />
              <div class="column items-start q-ml-sm">
                <div class="text-caption text-grey-6">PDF</div>
                <div class="text-weight-medium">
                  Bs {{ props.row.datos_extraidos?.monto_extraido || 'N/A' }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Estado -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="getEstadoColor(props.row.estado_subida)">
              {{ props.row.estado_subida || 'Pendiente' }}
            </q-badge>
          </q-td>
        </template>

        <!-- Acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round color="primary" icon="visibility" @click="verFactura(props.row)">
              <q-tooltip>Ver Factura PDF</q-tooltip>
            </q-btn>
            <q-btn flat dense round color="info" icon="info" @click="verDetalles(props.row)">
              <q-tooltip>Ver Detalles Completos</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Sección de Rezagados -->
    <div class="q-mt-xl">
      <div class="row justify-between items-center q-mb-md">
        <div>
          <div class="text-h6 text-weight-medium">
            <q-icon name="schedule" class="q-mr-sm" color="orange" />
            Docentes Rezagados del Corte
          </div>
          <div class="text-caption text-grey-7">
            Docentes que no subieron su factura dentro del periodo de facturación establecido
          </div>
        </div>
        <q-btn color="orange" icon="download" label="Exportar Rezagados Aprobados" unelevated @click="exportRezagados"
          :disable="filteredRezagados.length === 0">
          <q-tooltip>Solo exporta rezagados con estado APROBADO</q-tooltip>
        </q-btn>
      </div>

      <q-card flat bordered class="shadow-2">
        <q-table :rows="filteredRezagados" :columns="rezagadosColumns" row-key="id" :loading="loadingRezagados" flat
          :rows-per-page-options="[10, 25, 50]">
          <template v-slot:body-cell-docente="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ props.row.docente?.apellidos }} {{ props.row.docente?.nombre }}
              </div>
              <div class="text-caption text-grey-6">CI: {{ props.row.docente?.ci }}</div>
            </q-td>
          </template>

          <!-- NIT Emisor -->
          <template v-slot:body-cell-nit_emisor="props">
            <q-td :props="props">
              <q-badge color="purple" class="text-weight-bold">
                {{ props.row.datos_extraidos?.nit_emisor || 'N/A' }}
              </q-badge>
            </q-td>
          </template>

          <!-- Razón Social -->
          <template v-slot:body-cell-razon_social="props">
            <q-td :props="props">
              <div class="text-caption" style="max-width: 200px; white-space: normal;">
                {{ props.row.datos_extraidos?.razon_social || 'N/A' }}
              </div>
            </q-td>
          </template>

          <!-- Número Factura -->
          <template v-slot:body-cell-numero_factura="props">
            <q-td :props="props">
              <q-badge color="info">
                {{ props.row.datos_extraidos?.numero_factura || 'N/A' }}
              </q-badge>
            </q-td>
          </template>

          <!-- Fecha Factura -->
          <template v-slot:body-cell-fecha_factura="props">
            <q-td :props="props">
              {{ props.row.datos_extraidos?.fecha_factura || 'N/A' }}
            </q-td>
          </template>

          <!-- Comparación Montos -->
          <template v-slot:body-cell-montos="props">
            <q-td :props="props">
              <div class="row items-center no-wrap justify-center">
                <div class="column items-end q-mr-sm">
                  <div class="text-caption text-grey-6">Excel</div>
                  <div class="text-weight-medium">
                    Bs {{ props.row.monto_excel }}
                  </div>
                </div>
                <q-icon :name="montosCoinciden(props.row) ? 'check_circle' : 'warning'"
                  :color="montosCoinciden(props.row) ? 'positive' : 'warning'" size="sm" />
                <div class="column items-start q-ml-sm">
                  <div class="text-caption text-grey-6">PDF</div>
                  <div class="text-weight-medium">
                    Bs {{ props.row.datos_extraidos?.monto_extraido || 'N/A' }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Acciones -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat dense round color="primary" icon="visibility" @click="verFactura(props.row)">
                <q-tooltip>Ver Factura PDF</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center q-pa-lg text-grey-6">
              <q-icon name="check_circle" size="md" class="q-mr-sm" color="positive" />
              No hay facturas de rezagados en este corte
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Dialog de Detalles -->
    <q-dialog v-model="detallesDialog">
      <q-card style="min-width: 500px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="analytics" class="q-mr-sm" />
            Detalles de Extracción
          </div>
        </q-card-section>

        <q-card-section v-if="selectedRow">
          <div class="q-gutter-md">
            <!-- Info Docente -->
            <div class="text-subtitle2 text-grey-8">Docente</div>
            <q-field outlined dense label="Nombre Completo" stack-label>
              <template v-slot:control>
                <div class="self-center">
                  {{ selectedRow.docente?.apellidos }} {{ selectedRow.docente?.nombre }}
                </div>
              </template>
            </q-field>

            <div class="row q-gutter-md">
              <q-field outlined dense label="Sede" stack-label class="col">
                <template v-slot:control>
                  <div class="self-center">{{ selectedRow.sede }}</div>
                </template>
              </q-field>
              <q-field outlined dense label="Carrera" stack-label class="col">
                <template v-slot:control>
                  <div class="self-center">{{ selectedRow.carrera }}</div>
                </template>
              </q-field>
            </div>

            <q-separator />

            <!-- Datos Extraídos -->
            <div class="text-subtitle2 text-grey-8">Datos Extraídos del PDF</div>

            <div class="row q-gutter-md">
              <q-field outlined dense label="NIT Emisor" stack-label class="col">
                <template v-slot:control>
                  <div class="self-center text-weight-bold text-primary">
                    {{ selectedRow.datos_extraidos?.nit_emisor || 'N/A' }}
                  </div>
                </template>
              </q-field>
              <q-field outlined dense label="N° Factura" stack-label class="col">
                <template v-slot:control>
                  <div class="self-center">
                    {{ selectedRow.datos_extraidos?.numero_factura || 'N/A' }}
                  </div>
                </template>
              </q-field>
            </div>

            <q-field outlined dense label="Razón Social" stack-label>
              <template v-slot:control>
                <div class="self-center">
                  {{ selectedRow.datos_extraidos?.razon_social || 'N/A' }}
                </div>
              </template>
            </q-field>

            <div class="row q-gutter-md">
              <q-field outlined dense label="Fecha Factura" stack-label class="col">
                <template v-slot:control>
                  <div class="self-center">
                    {{ selectedRow.datos_extraidos?.fecha_factura || 'N/A' }}
                  </div>
                </template>
              </q-field>
              <q-field outlined dense label="Monto Extraído" stack-label class="col">
                <template v-slot:control>
                  <div class="self-center text-weight-bold">
                    Bs {{ selectedRow.datos_extraidos?.monto_extraido || 'N/A' }}
                  </div>
                </template>
              </q-field>
            </div>

            <q-field outlined dense label="Código de Autorización" stack-label>
              <template v-slot:control>
                <div class="self-center text-caption" style="word-break: break-all;">
                  {{ selectedRow.datos_extraidos?.codigo_autorizacion || 'N/A' }}
                </div>
              </template>
            </q-field>

            <q-separator />

            <!-- Comparación -->
            <div class="text-subtitle2 text-grey-8">Comparación de Montos</div>
            <div class="row items-center justify-center q-pa-md">
              <q-chip color="grey-3" text-color="dark" size="lg">
                <q-avatar color="primary" text-color="white" icon="table_chart" />
                Excel: Bs {{ selectedRow.monto_excel }}
              </q-chip>
              <q-icon :name="montosCoinciden(selectedRow) ? 'check_circle' : 'warning'"
                :color="montosCoinciden(selectedRow) ? 'positive' : 'warning'" size="md" class="q-mx-md" />
              <q-chip color="grey-3" text-color="dark" size="lg">
                <q-avatar color="secondary" text-color="white" icon="picture_as_pdf" />
                PDF: Bs {{ selectedRow.datos_extraidos?.monto_extraido || 'N/A' }}
              </q-chip>
            </div>

            <q-banner v-if="!montosCoinciden(selectedRow)" class="bg-warning text-white" rounded>
              <template v-slot:avatar>
                <q-icon name="warning" />
              </template>
              Los montos no coinciden. Verifique la factura.
            </q-banner>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'DatosExtraidosPage',
  setup() {
    const $q = useQuasar()
    const datos = ref([])
    const cortes = ref([])
    const selectedCorte = ref(null)
    const loading = ref(false)
    const searchQuery = ref('')
    const detallesDialog = ref(false)
    const selectedRow = ref(null)
    const rezagados = ref([])
    const loadingRezagados = ref(false)

    // Filtros de Sede y Carrera
    const sedes = ref([])
    const carreras = ref([])
    const selectedSede = ref(null)
    const selectedCarrera = ref(null)

    const columns = [
      { name: 'docente', label: 'Docente', align: 'left', sortable: true },
      { name: 'nit_emisor', label: 'NIT Emisor', align: 'center', sortable: true },
      { name: 'razon_social', label: 'Razón Social', align: 'left' },
      { name: 'numero_factura', label: 'N° Factura', align: 'center', sortable: true },
      { name: 'fecha_factura', label: 'Fecha', align: 'center', sortable: true },
      { name: 'montos', label: 'Comparación Montos', align: 'center' },
      { name: 'estado', label: 'Estado', align: 'center' },
      { name: 'actions', label: 'Acciones', align: 'center' }
    ]

    const datosCompletos = computed(() => {
      return datos.value.filter(d =>
        d.datos_extraidos?.nit_emisor &&
        d.datos_extraidos?.numero_factura &&
        d.datos_extraidos?.monto_extraido
      ).length
    })

    const montosDiferentes = computed(() => {
      return datos.value.filter(d => !montosCoinciden(d)).length
    })

    // Opciones para selectores de Sede y Carrera
    const sedeOptions = computed(() => {
      if (!sedes.value || !Array.isArray(sedes.value)) return []
      return sedes.value.map(s => ({
        label: s.nombre,
        value: s.nombre
      }))
    })

    const carreraOptions = computed(() => {
      if (!selectedSede.value) return []
      const sede = sedes.value.find(s => s.nombre === selectedSede.value)
      if (!sede || !sede.sede_carreras) return []
      return sede.sede_carreras.map(sc => ({
        label: sc.carrera?.nombre || 'Sin nombre',
        value: sc.carrera?.nombre || ''
      })).filter(c => c.value)
    })

    const filteredDatos = computed(() => {
      let result = datos.value

      // Filtrar por Sede
      if (selectedSede.value) {
        result = result.filter(d => d.sede === selectedSede.value)
      }

      // Filtrar por Carrera
      if (selectedCarrera.value) {
        result = result.filter(d => d.carrera === selectedCarrera.value)
      }

      // Filtrar por texto de búsqueda
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(d => {
          const docente = `${d.docente?.apellidos || ''} ${d.docente?.nombre || ''} ${d.docente?.ci || ''}`.toLowerCase()
          const nit = (d.datos_extraidos?.nit_emisor || '').toLowerCase()
          const razon = (d.datos_extraidos?.razon_social || '').toLowerCase()
          return docente.includes(query) || nit.includes(query) || razon.includes(query)
        })
      }

      return result
    })

    // Filtrar rezagados también
    const filteredRezagados = computed(() => {
      let result = rezagados.value

      if (selectedSede.value) {
        result = result.filter(d => d.sede === selectedSede.value)
      }

      if (selectedCarrera.value) {
        result = result.filter(d => d.carrera === selectedCarrera.value)
      }

      return result
    })

    const montosCoinciden = (row) => {
      if (!row.datos_extraidos?.monto_extraido) return false
      return parseFloat(row.monto_excel) === parseFloat(row.datos_extraidos.monto_extraido)
    }

    const getEstadoColor = (estado) => {
      const colors = {
        'SUBIDA': 'blue',
        'APROBADO': 'positive',
        'DENEGADO': 'negative'
      }
      return colors[estado] || 'grey'
    }

    const rezagadosColumns = [
      { name: 'docente', label: 'Docente', align: 'left', sortable: true },
      { name: 'nit_emisor', label: 'NIT Emisor', align: 'center', sortable: true },
      { name: 'razon_social', label: 'Razón Social', align: 'left' },
      { name: 'numero_factura', label: 'N° Factura', align: 'center', sortable: true },
      { name: 'fecha_factura', label: 'Fecha Factura', align: 'center', sortable: true },
      { name: 'fecha_subida', label: 'Fecha Subida', field: 'fecha_subida', align: 'center' },
      { name: 'montos', label: 'Comparación Montos', align: 'center' },
      { name: 'actions', label: 'Acciones', align: 'center' }
    ]

    const loadCortes = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await api.get('/cortes', {
          headers: { Authorization: `Bearer ${token}` }
        })
        cortes.value = response.data
        selectedCorte.value = cortes.value.find(c => c.estado === 1) || cortes.value[0]
        if (selectedCorte.value) {
          loadDatosExtraidos()
          loadRezagados()
        }
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al cargar cortes' })
      }
    }

    const loadSedes = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await api.get('/sedes', {
          headers: { Authorization: `Bearer ${token}` }
        })
        sedes.value = response.data
      } catch (error) {
        console.error('Error al cargar sedes:', error)
      }
    }

    const onSedeChange = () => {
      selectedCarrera.value = null
    }

    const loadDatosExtraidos = async () => {
      if (!selectedCorte.value) return

      loading.value = true
      try {
        const token = localStorage.getItem('token')
        const response = await api.get('/facturaciones/datos-extraidos', {
          params: { corte_id: selectedCorte.value.id },
          headers: { Authorization: `Bearer ${token}` }
        })
        datos.value = response.data
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al cargar datos extraídos' })
      } finally {
        loading.value = false
      }
    }

    const loadRezagados = async () => {
      if (!selectedCorte.value) return

      loadingRezagados.value = true
      try {
        const token = localStorage.getItem('token')
        const response = await api.get('/facturaciones/rezagados', {
          params: { corte_id: selectedCorte.value.id },
          headers: { Authorization: `Bearer ${token}` }
        })
        rezagados.value = response.data
      } catch (error) {
        console.error('Error al cargar rezagados:', error)
      } finally {
        loadingRezagados.value = false
      }
    }

    const onCorteChange = () => {
      loadDatosExtraidos()
      loadRezagados()
    }

    const verFactura = (row) => {
      const isProduction = window.location.hostname !== 'localhost'
      const baseUrl = isProduction
        ? 'https://api.sirred.clubatleticoimperial.com'
        : 'http://localhost:8000'
      const url = `${baseUrl}/storage/${row.factura_path}`
      window.open(url, '_blank')
    }

    const verDetalles = (row) => {
      selectedRow.value = row
      detallesDialog.value = true
    }

    const exportDatosExtraidos = async () => {
      try {
        const token = localStorage.getItem('token')
        const params = {
          corte_id: selectedCorte.value.id
        }

        // Agregar filtros de sede y carrera si están seleccionados
        if (selectedSede.value) {
          params.sede_nombre = selectedSede.value
        }
        if (selectedCarrera.value) {
          params.carrera_nombre = selectedCarrera.value
        }

        const response = await api.get('/facturaciones/export-datos-extraidos', {
          params,
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        // Generar nombre descriptivo del archivo
        const corteName = selectedCorte.value?.nombre?.replace(/\s+/g, '_') || 'Corte'
        const date = new Date().toISOString().split('T')[0]
        let filenameParts = ['Aprobados', corteName]

        if (selectedSede.value) {
          filenameParts.push(selectedSede.value.replace(/\s+/g, '_'))
        }
        if (selectedCarrera.value) {
          filenameParts.push(selectedCarrera.value.replace(/\s+/g, '_'))
        }

        filenameParts.push(date)
        const filename = filenameParts.join('_') + '.xlsx'

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        $q.notify({ type: 'positive', message: 'Datos extraídos exportados correctamente' })
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al exportar datos extraídos' })
      }
    }

    const exportRezagados = async () => {
      try {
        const token = localStorage.getItem('token')
        const params = {
          corte_id: selectedCorte.value.id
        }

        // Agregar filtros de sede y carrera si están seleccionados
        if (selectedSede.value) {
          params.sede_nombre = selectedSede.value
        }
        if (selectedCarrera.value) {
          params.carrera_nombre = selectedCarrera.value
        }

        const response = await api.get('/facturaciones/export-datos-rezagados', {
          params,
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        // Generar nombre descriptivo del archivo
        const corteName = selectedCorte.value?.nombre?.replace(/\s+/g, '_') || 'Corte'
        const date = new Date().toISOString().split('T')[0]
        let filenameParts = ['Rezagados_Aprobados', corteName]

        if (selectedSede.value) {
          filenameParts.push(selectedSede.value.replace(/\s+/g, '_'))
        }
        if (selectedCarrera.value) {
          filenameParts.push(selectedCarrera.value.replace(/\s+/g, '_'))
        }

        filenameParts.push(date)
        const filename = filenameParts.join('_') + '.xlsx'

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        $q.notify({ type: 'positive', message: 'Datos de rezagados exportados correctamente' })
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al exportar datos de rezagados' })
      }
    }

    onMounted(() => {
      loadCortes()
      loadSedes()
    })

    return {
      datos,
      cortes,
      selectedCorte,
      loading,
      searchQuery,
      columns,
      filteredDatos,
      datosCompletos,
      montosDiferentes,
      detallesDialog,
      selectedRow,
      montosCoinciden,
      getEstadoColor,
      loadDatosExtraidos,
      loadRezagados,
      onCorteChange,
      verFactura,
      verDetalles,
      exportDatosExtraidos,
      exportRezagados,
      rezagados,
      loadingRezagados,
      rezagadosColumns,
      // Nuevos para filtros
      sedes,
      selectedSede,
      selectedCarrera,
      sedeOptions,
      carreraOptions,
      onSedeChange,
      filteredRezagados
    }
  }
}
</script>
