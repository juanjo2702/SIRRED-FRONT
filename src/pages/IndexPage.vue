<template>
  <q-page class="q-pa-md">
    <!-- Header con filtros -->
    <div class="row q-mb-lg items-center">
      <div class="col-12 col-md-6">
        <h4 class="text-h4 text-weight-bold q-ma-none text-primary">
          <q-icon name="dashboard" size="36px" class="q-mr-sm" />
          Dashboard - {{ corteActivo?.nombre || 'Cargando...' }}
        </h4>
        <p class="text-grey-7 q-mt-sm q-mb-none">
          {{ corteActivo ? `Período: ${formatDate(corteActivo.fecha_inicio)} - ${formatDate(corteActivo.fecha_fin)}` :
            '' }}
        </p>
      </div>
      <div class="col-12 col-md-6 q-mt-md q-mt-md-none">
        <q-select v-model="selectedSede" :options="sedeOptions" label="Filtrar por Sede" outlined dense clearable
          emit-value map-options @update:model-value="loadStats" class="bg-white">
          <template v-slot:prepend>
            <q-icon name="location_city" />
          </template>
        </q-select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- KPI Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card bg-gradient-primary">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h6 text-white">Total Facturaciones</div>
                  <div class="text-h3 text-weight-bold text-white">{{ stats.resumen?.total_facturaciones || 0 }}</div>
                </div>
                <div class="col-auto">
                  <q-icon name="receipt_long" size="56px" class="text-white" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card bg-gradient-success">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h6 text-white">Total Docentes</div>
                  <div class="text-h3 text-weight-bold text-white">{{ stats.resumen?.total_docentes || 0 }}</div>
                </div>
                <div class="col-auto">
                  <q-icon name="people" size="56px" class="text-white" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card bg-gradient-warning">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h6 text-white">Monto Total</div>
                  <div class="text-h3 text-weight-bold text-white">Bs. {{ formatMoney(stats.resumen?.monto_total || 0)
                    }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon name="attach_money" size="56px" class="text-white" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="kpi-card bg-gradient-info">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h6 text-white">Carga Horaria</div>
                  <div class="text-h3 text-weight-bold text-white">{{ stats.resumen?.carga_horaria_total || 0 }} hrs
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon name="schedule" size="56px" class="text-white" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Estado de Facturas Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-4">
          <q-card class="status-card">
            <q-card-section class="text-center">
              <q-icon name="pending" size="48px" class="text-orange" />
              <div class="text-h4 text-weight-bold q-mt-md">{{ stats.resumen?.facturas_pendientes || 0 }}</div>
              <div class="text-subtitle1 text-grey-7">Facturas Pendientes</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="status-card">
            <q-card-section class="text-center">
              <q-icon name="upload" size="48px" class="text-blue" />
              <div class="text-h4 text-weight-bold q-mt-md">{{ stats.resumen?.facturas_subidas || 0 }}</div>
              <div class="text-subtitle1 text-grey-7">Facturas Subidas</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="status-card">
            <q-card-section class="text-center">
              <q-icon name="check_circle" size="48px" class="text-green" />
              <div class="text-h4 text-weight-bold q-mt-md">{{ stats.resumen?.facturas_aprobadas || 0 }}</div>
              <div class="text-subtitle1 text-grey-7">Facturas Aprobadas</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card class="chart-card">
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="pie_chart" class="q-mr-sm" />
                Facturaciones por Tipo de Contrato
              </div>
              <div style="height: 300px">
                <Doughnut :data="chartTipoContrato" :options="doughnutOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="chart-card">
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="assessment" class="q-mr-sm" />
                Estado de Facturas
              </div>
              <div style="height: 300px">
                <Pie :data="chartEstadoFacturas" :options="pieOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card class="chart-card">
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="location_city" class="q-mr-sm" />
                Facturaciones por Sede
              </div>
              <div style="height: 300px">
                <Bar :data="chartSedes" :options="barOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="chart-card">
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="attach_money" class="q-mr-sm" />
                Montos por Tipo de Contrato
              </div>
              <div style="height: 300px">
                <Bar :data="chartMontos" :options="barOptionsHorizontal" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Top Carreras -->
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-card class="chart-card">
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="school" class="q-mr-sm" />
                Top 10 Carreras con Más Facturaciones
              </div>
              <div style="height: 400px">
                <Bar :data="chartCarreras" :options="barOptionsCarreras" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut, Pie, Bar } from 'vue-chartjs'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

defineOptions({
  name: 'IndexPage'
})

const loading = ref(true)
const stats = ref({})
const corteActivo = ref(null)
const selectedSede = ref(null)
const sedes = ref([])

const sedeOptions = computed(() => [
  { label: 'Todas las Sedes', value: null },
  ...sedes.value.map(s => ({ label: s.nombre, value: s.id }))
])

// Chart colors
const colors = {
  primary: '#9C27B0',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#2196F3',
  purple: '#9C27B0',
  blue: '#2196F3',
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#F44336',
  teal: '#009688',
  cyan: '#00BCD4',
  pink: '#E91E63',
  indigo: '#3F51B5'
}

const chartTipoContrato = computed(() => ({
  labels: stats.value.facturaciones_por_tipo?.map(item => item.tipo_contrato) || [],
  datasets: [{
    data: stats.value.facturaciones_por_tipo?.map(item => item.total) || [],
    backgroundColor: [colors.primary, colors.success, colors.warning],
    borderWidth: 2,
    borderColor: '#fff'
  }]
}))

const chartEstadoFacturas = computed(() => {
  const estados = stats.value.facturaciones_por_estado || []
  const labels = []
  const data = []
  const bgColors = []

  estados.forEach(item => {
    if (item.estado_subida === null) {
      labels.push('Pendiente')
      data.push(item.total)
      bgColors.push(colors.orange)
    } else if (item.estado_subida === 'SUBIDA') {
      labels.push('Subida')
      data.push(item.total)
      bgColors.push(colors.blue)
    } else if (item.estado_subida === 'APROBADO') {
      labels.push('Aprobado')
      data.push(item.total)
      bgColors.push(colors.green)
    } else if (item.estado_subida === 'DENEGADO') {
      labels.push('Denegado')
      data.push(item.total)
      bgColors.push(colors.red)
    }
  })

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: bgColors,
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

const chartSedes = computed(() => ({
  labels: stats.value.facturaciones_por_sede?.map(item => item.sede) || [],
  datasets: [{
    label: 'Facturaciones',
    data: stats.value.facturaciones_por_sede?.map(item => item.total) || [],
    backgroundColor: colors.primary,
    borderRadius: 8
  }]
}))

const chartMontos = computed(() => ({
  labels: stats.value.montos_por_tipo?.map(item => item.tipo_contrato) || [],
  datasets: [{
    label: 'Monto Total (Bs.)',
    data: stats.value.montos_por_tipo?.map(item => parseFloat(item.total_monto || 0)) || [],
    backgroundColor: [colors.success, colors.info, colors.warning],
    borderRadius: 8
  }]
}))

const chartCarreras = computed(() => ({
  labels: stats.value.facturaciones_por_carrera?.map(item => item.carrera) || [],
  datasets: [{
    label: 'Facturaciones',
    data: stats.value.facturaciones_por_carrera?.map(item => item.total) || [],
    backgroundColor: colors.info,
    borderRadius: 8
  }]
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 15,
        font: { size: 12 }
      }
    }
  }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 15,
        font: { size: 12 }
      }
    }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
}

const barOptionsHorizontal = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      beginAtZero: true
    }
  }
}

const barOptionsCarreras = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
}

const loadStats = async () => {
  try {
    loading.value = true
    const params = {}
    if (selectedSede.value) {
      params.sede_id = selectedSede.value
    }

    const response = await api.get('/dashboard/stats', { params })
    stats.value = response.data
    corteActivo.value = response.data.corte_activo
  } catch (error) {
    console.error('Error loading stats:', error)
    Notify.create({
      type: 'negative',
      message: 'Error al cargar las estadísticas'
    })
  } finally {
    loading.value = false
  }
}

const loadSedes = async () => {
  try {
    const response = await api.get('/sedes')
    sedes.value = response.data
  } catch (error) {
    console.error('Error loading sedes:', error)
  }
}

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadSedes()
  loadStats()
})
</script>

<style scoped>
.kpi-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.status-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
}

.bg-gradient-success {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
}

.bg-gradient-warning {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

.bg-gradient-info {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}
</style>
