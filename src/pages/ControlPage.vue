<template>
  <q-page padding>
    <div class="q-mb-md">
      <div class="text-h5 text-weight-medium">Control de Facturas</div>
      <div class="text-caption text-grey-7">Gestione y apruebe las facturas subidas por los docentes</div>
    </div>

    <q-card class="q-mb-md shadow-2" flat bordered>
      <q-card-section class="bg-grey-2">
        <div class="text-subtitle1 text-grey-8">Filtros</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="selectedCorte" :options="cortes" option-label="nombre" option-value="id" label="Corte"
              outlined dense @update:model-value="loadFacturaciones">
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="selectedSede" :options="sedeOptions" label="Sede" outlined dense clearable
              @update:model-value="onSedeChange">
              <template v-slot:prepend>
                <q-icon name="location_city" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="selectedCarrera" :options="carreraOptions" label="Carrera" outlined dense clearable>
              <template v-slot:prepend>
                <q-icon name="school" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select v-model="estadoSubida" :options="estadoOptions" label="Estado" outlined dense
              @update:model-value="loadFacturaciones">
              <template v-slot:prepend>
                <q-icon name="filter_list" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-12 col-md-4">
            <q-input v-model="searchQuery" outlined dense placeholder="Buscar por nombre de docente o CI..." clearable>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row justify-between items-center q-mb-md">
      <div class="text-subtitle1 text-grey-8">
        {{ filteredFacturaciones.length }} factura(s) encontrada(s)
      </div>
      <div class="row q-gutter-sm">
        <q-btn v-if="selected.length > 0" color="warning" icon="edit" :label="`Editar (${selected.length})`" unelevated
          @click="openBulkEditDialog">
          <q-tooltip>Editar Sede/Carrera de seleccionados</q-tooltip>
        </q-btn>
        
        <q-btn color="indigo-7" icon="picture_as_pdf" label="PDF Consolidado" unelevated @click="openPrintPackageDialog">
          <q-tooltip>Generar un único PDF con portada y facturas unidas</q-tooltip>
        </q-btn>

        <q-btn color="positive" icon="download" label="Exportar a Excel" unelevated @click="exportToExcel"
          :disable="filteredFacturaciones.length === 0">
          <q-tooltip>Descargar datos filtrados en Excel</q-tooltip>
        </q-btn>

        <q-btn color="teal" icon="open_in_new" label="Portal Docente" unelevated @click="openPublicPortal">
          <q-tooltip>Abrir enlace público donde los docentes suben facturas</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-table :rows="filteredFacturaciones" :columns="columns" row-key="id" :loading="loading" flat bordered
      :rows-per-page-options="[10, 25, 50, 100]" class="shadow-2" selection="multiple" v-model:selected="selected">
      <template v-slot:body-cell-docente="props">
        <q-td :props="props">
          <div>
            <div class="text-weight-bold">{{ props.row.docente?.apellidos }}</div>
            <div>{{ props.row.docente?.nombre }}</div>
            <div class="text-caption text-grey-7">
              CI: {{ props.row.docente?.ci }}
              <span v-if="props.row.docente?.complemento">- {{ props.row.docente.complemento }}</span>
            </div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-sede_carrera="props">
        <q-td :props="props">
          <div>{{ props.row.sede_carrera?.sede?.nombre }}</div>
          <div class="text-caption text-grey-7">{{ props.row.sede_carrera?.carrera?.nombre }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-tipo_contrato="props">
        <q-td :props="props">
          <q-badge :color="props.row.tipo_contrato === 'FACTURACION' ? 'primary' : 'grey'">
            {{ props.row.tipo_contrato }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-fecha_subida="props">
        <q-td :props="props">
          <div v-if="props.row.fecha_subida">
            {{ formatDate(props.row.fecha_subida) }}
          </div>
          <div v-else class="text-grey-6">-</div>
        </q-td>
      </template>

      <template v-slot:body-cell-estado_subida="props">
        <q-td :props="props">
          <q-badge v-if="props.row.estado_subida === null" color="grey-6">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            Pendiente
          </q-badge>
          <q-badge v-else-if="props.row.estado_subida === 'SUBIDA'" color="blue">
            <q-icon name="cloud_upload" size="xs" class="q-mr-xs" />
            Subida
          </q-badge>
          <q-badge v-else-if="props.row.estado_subida === 'APROBADO'" color="positive">
            <q-icon name="check_circle" size="xs" class="q-mr-xs" />
            Aprobado
          </q-badge>
          <q-badge v-else-if="props.row.estado_subida === 'DENEGADO'" color="negative">
            <q-icon name="cancel" size="xs" class="q-mr-xs" />
            Denegado
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <div class="row justify-center items-center q-gutter-sm no-wrap">
            <q-btn flat dense round color="warning" icon="edit" @click="openSingleEditDialog(props.row)">
              <q-tooltip>Editar Registro</q-tooltip>
            </q-btn>

            <q-btn v-if="props.row.factura_path" flat dense round color="primary" icon="visibility"
              @click="previewFactura(props.row)">
              <q-tooltip>Ver Factura</q-tooltip>
            </q-btn>

            <q-btn v-if="props.row.estado_subida === 'SUBIDA'" flat dense round color="positive" icon="check_circle"
              @click="approveFactura(props.row)">
              <q-tooltip>Aprobar Factura</q-tooltip>
            </q-btn>

            <q-btn v-if="props.row.estado_subida === 'SUBIDA'" flat dense round color="negative" icon="cancel"
              @click="denyFactura(props.row)">
              <q-tooltip>Denegar Factura</q-tooltip>
            </q-btn>

            <q-btn flat dense round color="negative" icon="delete" @click="deleteFacturacion(props.row)">
              <q-tooltip>Eliminar Registro</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- PDF Preview Dialog (Drawer Style) -->
    <q-dialog v-model="previewDialog" position="right" full-height>
      <q-card class="column bg-grey-3" style="width: 850px; max-width: 90vw;">
        <q-toolbar class="bg-dark text-white">
          <q-icon name="visibility" size="sm" color="warning" />
          <q-toolbar-title class="text-subtitle1 text-weight-bold text-uppercase tracking-wider">
            Previsualización de Archivo
          </q-toolbar-title>
          
          <q-btn flat round dense icon="open_in_new" @click="downloadCurrentFactura">
             <q-tooltip>Abrir en nueva pestaña</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="close" v-close-popup>
            <q-tooltip>Cerrar Visor</q-tooltip>
          </q-btn>
        </q-toolbar>

        <q-card-section v-if="currentPreviewFactura" class="bg-grey-2 q-pa-sm border-bottom">
           <div class="row items-center text-caption text-grey-8">
             <q-icon name="person" class="q-mr-xs" size="16px" />
             <span class="text-weight-bold q-mr-sm">Docente:</span> 
             {{ currentPreviewFactura.docente?.nombre }} {{ currentPreviewFactura.docente?.apellidos }}
           </div>
        </q-card-section>

        <q-card-section class="col q-pa-none bg-grey-9 flex flex-center" style="min-height: 400px;">
          <iframe v-if="previewUrl" :src="previewUrl" style="width: 100%; height: 100%; border: none;" title="PDF Preview"></iframe>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit Dialog (Single and Bulk) -->
    <q-dialog v-model="editDialog" persistent>
      <q-card :style="isBulkEdit ? 'width: 450px; max-width: 90vw;' : 'width: 850px; max-width: 90vw;'">
        <q-card-section class="bg-primary text-white row items-center">
          <q-icon :name="isBulkEdit ? 'group_work' : 'person'" size="sm" class="q-mr-sm" />
          <div>
            <div class="text-h6">{{ isBulkEdit ? 'Editar Múltiples Asignaciones' : 'Editar Asignación Completa' }}</div>
            <div class="text-caption text-grey-3">
              {{ isBulkEdit ? `Se actualizarán ${selected.length} registros seleccionados.` : 'Modifique la información demográfica, de contrato o académica.' }}
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md" style="max-height: 70vh; overflow-y: auto;">
          <!-- BULK EDIT FIELDS -->
          <div v-if="isBulkEdit" class="q-gutter-md">
            <q-select v-model="editForm.sede" :options="allSedes" option-label="nombre" option-value="id" label="Sede"
              outlined dense @update:model-value="onEditSedeChange" :rules="[val => !!val || 'Sede es requerida']" />

            <q-select v-model="editForm.carrera" :options="availableCarreras" option-label="nombre" option-value="id"
              label="Carrera" outlined dense :disable="!editForm.sede" :rules="[val => !!val || 'Carrera es requerida']" />
              
            <q-input v-model="editForm.comment" label="Comentario de Auditoría" outlined dense type="textarea" rows="2"
              placeholder="Indique el motivo del cambio masivo..." />
          </div>

          <!-- SINGLE EDIT FIELDS -->
          <q-form v-else ref="singleEditForm">
            <!-- Sección 1: Datos Personales del Docente -->
            <div class="text-subtitle2 text-primary text-weight-bold q-mb-sm q-pb-xs" style="border-bottom: 2px solid var(--q-primary);">
              1. Información Personal del Docente
            </div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12 col-sm-4">
                <q-input v-model="editForm.nombres" label="Nombres" outlined dense :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="editForm.apellidos" label="Apellidos" outlined dense :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="editForm.ci" label="Cédula de Identidad (C.I.)" outlined dense :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-3">
                <q-input v-model="editForm.complemento" label="Complemento (C.I.)" outlined dense />
              </div>
              <div class="col-12 col-sm-5">
                <q-input v-model="editForm.correo" label="Correo Electrónico" outlined dense type="email" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="editForm.telefono" label="Teléfono / Celular" outlined dense />
              </div>
              <div class="col-12">
                <q-btn-toggle
                  v-model="editForm.docente_estado"
                  spread
                  no-caps
                  toggle-color="primary"
                  color="white"
                  text-color="primary"
                  :options="[
                    {label: 'Docente Activo', value: 1},
                    {label: 'Docente Inactivo', value: 0}
                  ]"
                  dense
                  outlined
                />
              </div>
            </div>

            <!-- Sección 2: Asignación Académica y Facturación -->
            <div class="text-subtitle2 text-primary text-weight-bold q-mb-sm q-pb-xs" style="border-bottom: 2px solid var(--q-primary);">
              2. Asignación Académica y Económica
            </div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12 col-sm-4">
                <q-select v-model="editForm.corte" :options="cortes" option-label="nombre" option-value="id" label="Corte Asociado"
                  outlined dense :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-select v-model="editForm.sede" :options="allSedes" option-label="nombre" option-value="id" label="Sede"
                  outlined dense @update:model-value="onEditSedeChange" :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-select v-model="editForm.carrera" :options="availableCarreras" option-label="nombre" option-value="id"
                  label="Carrera" outlined dense :disable="!editForm.sede" :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-select v-model="editForm.tipo_contrato" :options="['FACTURACION', 'RETENCION', 'AFILIACION']" label="Tipo Contrato"
                  outlined dense :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model.number="editForm.monto" type="number" step="0.01" label="Monto Asignado (Bs.)" outlined dense
                  :rules="[val => val >= 0 || 'Debe ser positivo']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model.number="editForm.carga_horaria" type="number" label="Carga Horaria (Hrs)" outlined dense
                  :rules="[val => val >= 0 || 'Debe ser positivo']" />
              </div>
              
              <!-- Estado de Factura -->
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="editForm.estado_subida"
                  :options="[
                    {label: 'Pendiente', value: null},
                    {label: 'Subida', value: 'SUBIDA'},
                    {label: 'Aprobado', value: 'APROBADO'},
                    {label: 'Denegado', value: 'DENEGADO'}
                  ]"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Estado de Factura / Respaldo"
                  outlined
                  dense
                />
              </div>

              <!-- Observaciones -->
              <div class="col-12 col-sm-6">
                <q-input v-model="editForm.observaciones" label="Observaciones del Registro" outlined dense type="textarea" rows="1" />
              </div>
            </div>

            <!-- Sección 3: Prácticas Hospitalarias (Condicional) -->
            <div v-if="editForm.es_practica" class="q-mb-md">
              <div class="text-subtitle2 text-purple text-weight-bold q-mb-sm q-pb-xs" style="border-bottom: 2px solid purple;">
                3. Detalles de Prácticas Hospitalarias
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-input v-model="editForm.fecha_inicio_practica" type="date" label="Fecha Inicio Práctica" outlined dense stack-label />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="editForm.fecha_fin_practica" type="date" label="Fecha Fin Práctica" outlined dense stack-label />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="editForm.materia_practica" label="Materia Asociada" outlined dense />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="editForm.hospital_practica" label="Centro Médico / Hospital" outlined dense />
                </div>
              </div>
            </div>

            <!-- Sección 4: Archivo PDF de Factura & Auditoría -->
            <div class="text-subtitle2 text-grey-8 text-weight-bold q-mb-sm q-pb-xs" style="border-bottom: 2px solid #555555;">
              4. Carga Especial de PDF y Auditoría Enterprise
            </div>
            
            <!-- Corte Cerrado Info Alert -->
            <q-banner v-if="editForm.isCorteClosed" class="bg-amber-1 text-amber-9 q-mb-sm border-amber" rounded dense>
              <template v-slot:avatar>
                <q-icon name="warning" color="amber" />
              </template>
              <strong>Corte Cerrado:</strong> Este corte administrativo está cerrado. Toda modificación o carga de PDF requiere un motivo explícito para la auditoría.
            </q-banner>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-file v-model="editForm.facturaFile" label="Reemplazar/Subir Factura PDF (Administrativo)" outlined dense accept=".pdf" max-file-size="2097152">
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                  <template v-slot:hint>
                    Deje vacío si no desea modificar el archivo actual
                  </template>
                </q-file>
              </div>

              <div class="col-12 col-sm-6 flex items-center">
                <div v-if="editForm.isApproved" class="bg-red-1 text-red-9 border-red q-pa-sm rounded w-full">
                  <q-checkbox v-model="editForm.force" label="Forzar Edición (Ignorar bloqueo de Factura APROBADA)" color="negative" />
                </div>
                <div v-else class="text-caption text-grey-6">
                  Solo se puede forzar cambios si la factura tiene el estado APROBADO.
                </div>
              </div>

              <div class="col-12">
                <q-input
                  v-model="editForm.comment"
                  label="Motivo del Cambio / Comentario de Auditoría"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                  :rules="[val => (!editForm.isCorteClosed && !editForm.isApproved) || !!val || 'El motivo es obligatorio en corte cerrado o facturas aprobadas']"
                  placeholder="Explique el motivo del cambio para los logs de auditoría..."
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn label="Guardar Cambios" color="primary" icon="save" @click="saveEdit" :loading="savingEdit" unelevated />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Print Package Dialog -->
    <q-dialog v-model="printPackageDialog" persistent>
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section class="bg-indigo-7 text-white row items-center">
          <q-icon name="picture_as_pdf" size="sm" class="q-mr-sm" />
          <div>
            <div class="text-h6">Generar PDF Consolidado</div>
            <div class="text-caption text-indigo-2">Compilación unificada para impresión física</div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-md">
          <q-banner class="bg-blue-1 text-blue-9" rounded dense>
            <template v-slot:avatar>
              <q-icon name="info" color="blue" />
            </template>
            Se generará un único documento PDF con portada, lista de control y todas las facturas en orden alfabético.
          </q-banner>

          <q-select
            v-model="printForm.corte"
            :options="cortes"
            option-label="nombre"
            option-value="id"
            label="Seleccionar Corte (Obligatorio)"
            outlined
            dense
            :rules="[val => !!val || 'Corte es requerido']"
          />

          <q-select
            v-model="printForm.sede"
            :options="allSedes"
            option-label="nombre"
            option-value="id"
            label="Seleccionar Sede (Obligatorio)"
            outlined
            dense
            @update:model-value="onPrintSedeChange"
            :rules="[val => !!val || 'Sede es requerida']"
          />

          <q-select
            v-model="printForm.carrera"
            :options="printAvailableCarreras"
            option-label="nombre"
            option-value="id"
            label="Seleccionar Carrera (Opcional - Vacío para toda la Sede)"
            outlined
            dense
            :disable="!printForm.sede"
            clearable
          />

          <q-select
            v-model="printForm.estado_subida"
            :options="[
              { label: 'Todos los estados', value: null },
              { label: 'Subidas', value: 'SUBIDA' },
              { label: 'Aprobadas', value: 'APROBADO' },
              { label: 'Denegadas', value: 'DENEGADO' },
              { label: 'Pendientes', value: 'null' }
            ]"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Estado Factura (Opcional)"
            outlined
            dense
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            label="Generar y Descargar"
            color="indigo-7"
            icon="download"
            @click="generatePrintPackage"
            :loading="generatingPackage"
            unelevated
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'ControlPage',
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const facturaciones = ref([])
    const cortes = ref([])
    const selectedCorte = ref(null)
    const selectedSede = ref(null)
    const selectedCarrera = ref(null)
    const estadoSubida = ref({ label: 'Todos', value: null })
    const loading = ref(false)
    const searchQuery = ref('')
    const selected = ref([])

    // PDF Preview State
    const previewDialog = ref(false)
    const previewUrl = ref(null)
    const currentPreviewFactura = ref(null)

    // Edit Dialog State
    const editDialog = ref(false)
    const isBulkEdit = ref(false)
    const savingEdit = ref(false)
    const editForm = ref({
      id: null,
      nombres: '',
      apellidos: '',
      ci: '',
      complemento: '',
      correo: '',
      telefono: '',
      docente_estado: 1,
      sede: null,
      carrera: null,
      corte: null,
      tipo_contrato: 'FACTURACION',
      monto: 0,
      carga_horaria: 0,
      estado_subida: null,
      observaciones: '',
      es_practica: false,
      fecha_inicio_practica: '',
      fecha_fin_practica: '',
      materia_practica: '',
      hospital_practica: '',
      facturaFile: null,
      comment: '',
      force: false,
      isApproved: false,
      isCorteClosed: false
    })
    
    const allSedes = ref([])
    const allCarreras = ref([])
    const availableCarreras = ref([])

    // Print Package Dialog State
    const printPackageDialog = ref(false)
    const generatingPackage = ref(false)
    const printForm = ref({
      corte: null,
      sede: null,
      carrera: null,
      estado_subida: null
    })
    const printAvailableCarreras = ref([])

    const estadoOptions = [
      { label: 'Todos', value: null },
      { label: 'Pendientes', value: 'null' },
      { label: 'Subidas', value: 'SUBIDA' },
      { label: 'Aprobadas', value: 'APROBADO' },
      { label: 'Denegadas', value: 'DENEGADO' }
    ]

    const columns = [
      { name: 'docente', label: 'Docente', align: 'left', sortable: true },
      { name: 'sede_carrera', label: 'Sede - Carrera', align: 'left' },
      { name: 'tipo_contrato', label: 'Tipo', field: 'tipo_contrato', align: 'center' },
      { name: 'monto', label: 'Monto', field: 'monto', align: 'right', format: val => `Bs. ${val}`, sortable: true },
      { name: 'carga_horaria', label: 'Carga', field: 'carga_horaria', align: 'center', sortable: true },
      { name: 'fecha_subida', label: 'Fecha de Subida', align: 'center', sortable: true },
      { name: 'estado_subida', label: 'Estado', align: 'center' },
      { name: 'actions', label: 'Acciones', align: 'center' }
    ]

    const sedeOptions = computed(() => {
      const sedes = [...new Set(facturaciones.value.map(f => f.sede_carrera?.sede?.nombre).filter(Boolean))]
      return [{ label: 'Todas', value: null }, ...sedes.map(s => ({ label: s, value: s }))]
    })

    const carreraOptions = computed(() => {
      let filtered = facturaciones.value

      // Filter by selected sede first
      if (selectedSede.value?.value) {
        filtered = filtered.filter(f => f.sede_carrera?.sede?.nombre === selectedSede.value.value)
      }

      const carreras = [...new Set(filtered.map(f => f.sede_carrera?.carrera?.nombre).filter(Boolean))]
      return [{ label: 'Todas', value: null }, ...carreras.map(c => ({ label: c, value: c }))]
    })

    const filteredFacturaciones = computed(() => {
      let filtered = facturaciones.value

      // Filter by sede
      if (selectedSede.value?.value) {
        filtered = filtered.filter(f => f.sede_carrera?.sede?.nombre === selectedSede.value.value)
      }

      // Filter by carrera
      if (selectedCarrera.value?.value) {
        filtered = filtered.filter(f => f.sede_carrera?.carrera?.nombre === selectedCarrera.value.value)
      }

      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(fact => {
          const docenteName = `${fact.docente?.apellidos || ''} ${fact.docente?.nombre || ''}`.toLowerCase()
          const docenteCI = fact.docente?.ci?.toLowerCase() || ''
          return docenteName.includes(query) || docenteCI.includes(query)
        })
      }

      return filtered
    })

    const onSedeChange = () => {
      // Clear carrera selection when sede changes
      selectedCarrera.value = null
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    const loadCortes = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await api.get('/cortes', {
          headers: { Authorization: `Bearer ${token}` }
        })
        cortes.value = response.data
        // Auto-select active corte
        selectedCorte.value = cortes.value.find(c => c.estado === 1) || cortes.value[0]
        if (selectedCorte.value) {
          loadFacturaciones()
        }
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al cargar cortes' })
      }
    }

    const loadFacturaciones = async () => {
      if (!selectedCorte.value) return

      loading.value = true
      try {
        const token = localStorage.getItem('token')
        const params = {
          corte_id: selectedCorte.value.id,
          tipo_contrato: 'FACTURACION',
          es_practica: false
        }

        if (estadoSubida.value?.value !== null) {
          params.estado_subida = estadoSubida.value.value
        }

        const response = await api.get('/facturaciones', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        })
        facturaciones.value = response.data
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al cargar facturaciones' })
      } finally {
        loading.value = false
      }
    }

    const previewFactura = (facturacion) => {
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        apiUrl = 'http://localhost:8000/api'
      }
      const baseUrl = apiUrl.replace(/\/api\/?$/, '')
      previewUrl.value = `${baseUrl}/storage/${facturacion.factura_path}`
      currentPreviewFactura.value = facturacion
      previewDialog.value = true
    }

    const downloadCurrentFactura = () => {
      if (previewUrl.value) {
        window.open(previewUrl.value, '_blank')
      }
    }

    const approveFactura = async (facturacion) => {
      $q.dialog({
        title: 'Confirmar Aprobación',
        message: `¿Aprobar la factura de ${facturacion.docente?.nombre} ${facturacion.docente?.apellidos}?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          const token = localStorage.getItem('token')
          await api.post(`/facturaciones/${facturacion.id}/approve`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          $q.notify({ type: 'positive', message: 'Factura aprobada correctamente' })
          loadFacturaciones()
        } catch (error) {
          $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al aprobar factura' })
        }
      })
    }

    const denyFactura = async (facturacion) => {
      $q.dialog({
        title: 'Confirmar Denegación',
        message: `¿Denegar la factura de ${facturacion.docente?.nombre} ${facturacion.docente?.apellidos}?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          const token = localStorage.getItem('token')
          await api.post(`/facturaciones/${facturacion.id}/deny`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          $q.notify({ type: 'positive', message: 'Factura denegada' })
          loadFacturaciones()
        } catch (error) {
          $q.notify({ type: 'negative', message: 'Error al denegar factura' })
        }
      })
    }

    const deleteFacturacion = async (facturacion) => {
      $q.dialog({
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de que desea eliminar el registro del docente ${facturacion.docente?.nombre} ${facturacion.docente?.apellidos}? Esta acción no se puede deshacer y eliminará permanentemente la asignación de facturación, así como su archivo PDF asociado.`,
        cancel: true,
        persistent: true,
        ok: {
          color: 'negative',
          label: 'Eliminar'
        }
      }).onOk(async () => {
        try {
          const token = localStorage.getItem('token')
          await api.delete(`/facturaciones/${facturacion.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          $q.notify({ type: 'positive', message: 'Registro de facturación eliminado correctamente' })
          loadFacturaciones()
        } catch (error) {
          $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al eliminar el registro' })
        }
      })
    }

    const exportToExcel = async () => {
      try {
        const token = localStorage.getItem('token')
        const params = {
          corte_id: selectedCorte.value.id,
          tipo_contrato: 'FACTURACION',
          es_practica: false
        }

        if (estadoSubida.value?.value !== null && estadoSubida.value?.value !== 'null') {
          params.estado_subida = estadoSubida.value.value
        } else if (estadoSubida.value?.value === 'null') {
          params.estado_subida = 'null'
        }

        if (selectedSede.value?.value) {
          params.sede_nombre = selectedSede.value.value
        }

        if (selectedCarrera.value?.value) {
          params.carrera_nombre = selectedCarrera.value.value
        }

        const response = await api.get('/facturaciones/export', {
          params,
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'Facturas_Export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
          if (filenameMatch) filename = filenameMatch[1]
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        $q.notify({ type: 'positive', message: 'Excel exportado correctamente' })
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al exportar Excel' })
      }
    }

    const loadAllSedesAndCarreras = async () => {
      try {
        const token = localStorage.getItem('token')
        const [sedesRes, carrerasRes] = await Promise.all([
          api.get('/sedes', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/carreras', { headers: { Authorization: `Bearer ${token}` } })
        ])
        allSedes.value = sedesRes.data
        allCarreras.value = carrerasRes.data
      } catch (error) {
        console.error('Error loading metadata', error)
      }
    }

    const openBulkEditDialog = () => {
      isBulkEdit.value = true
      editForm.value = {
        id: null,
        sede: null,
        carrera: null,
        comment: ''
      }
      availableCarreras.value = []
      editDialog.value = true
    }

    const openSingleEditDialog = (row) => {
      isBulkEdit.value = false
      
      const currentSede = allSedes.value.find(s => s.id === row.sede_carrera?.sede_id) || null
      const currentCarrera = allCarreras.value.find(c => c.id === row.sede_carrera?.carrera_id) || null
      const currentCorte = cortes.value.find(c => c.id === row.corte_id) || null

      editForm.value = {
        id: row.id,
        nombres: row.docente?.nombre || '',
        apellidos: row.docente?.apellidos || '',
        ci: row.docente?.ci || '',
        complemento: row.docente?.complemento || '',
        correo: row.docente?.correo || '',
        telefono: row.docente?.telefono || '',
        docente_estado: row.docente?.estado !== undefined ? row.docente.estado : 1,
        
        sede: currentSede,
        carrera: currentCarrera,
        corte: currentCorte,
        tipo_contrato: row.tipo_contrato || 'FACTURACION',
        monto: row.monto || 0,
        carga_horaria: row.carga_horaria || 0,
        estado_subida: row.estado_subida,
        observaciones: row.observaciones || '',
        
        es_practica: row.es_practica || false,
        fecha_inicio_practica: row.fecha_inicio_practica || '',
        fecha_fin_practica: row.fecha_fin_practica || '',
        materia_practica: row.materia_practica || '',
        hospital_practica: row.hospital_practica || '',

        facturaFile: null,
        comment: '',
        force: false,
        isApproved: row.estado_subida === 'APROBADO',
        isCorteClosed: row.corte?.estado === 0
      }

      availableCarreras.value = allCarreras.value
      editDialog.value = true
    }

    const onEditSedeChange = (sede) => {
      if (!sede) {
        availableCarreras.value = []
        editForm.value.carrera = null
        return
      }
      availableCarreras.value = allCarreras.value
    }

    const saveEdit = async () => {
      if (!editForm.value.sede || !editForm.value.carrera) {
        $q.notify({ type: 'warning', message: 'Seleccione Sede y Carrera' })
        return
      }

      savingEdit.value = true
      try {
        const token = localStorage.getItem('token')

        if (isBulkEdit.value) {
          const ids = selected.value.map(s => s.id)
          await api.post('/facturaciones/bulk-update', {
            ids,
            sede_id: editForm.value.sede.id,
            carrera_id: editForm.value.carrera.id,
            comment: editForm.value.comment || 'Bulk Update Sede/Carrera'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          $q.notify({ type: 'positive', message: 'Registros actualizados correctamente' })
          selected.value = []
        } else {
          // Single Edit
          const payload = {
            nombres: editForm.value.nombres,
            apellidos: editForm.value.apellidos,
            ci: editForm.value.ci,
            complemento: editForm.value.complemento || null,
            correo: editForm.value.correo || null,
            telefono: editForm.value.telefono || null,
            docente_estado: editForm.value.docente_estado,
            sede_id: editForm.value.sede.id,
            carrera_id: editForm.value.carrera.id,
            corte_id: editForm.value.corte.id,
            tipo_contrato: editForm.value.tipo_contrato,
            monto: editForm.value.monto,
            carga_horaria: editForm.value.carga_horaria,
            estado_subida: editForm.value.estado_subida,
            observaciones: editForm.value.observaciones || null,
            es_practica: editForm.value.es_practica,
            fecha_inicio_practica: editForm.value.fecha_inicio_practica || null,
            fecha_fin_practica: editForm.value.fecha_fin_practica || null,
            materia_practica: editForm.value.materia_practica || null,
            hospital_practica: editForm.value.hospital_practica || null,
            comment: editForm.value.comment || 'Edición administrativa de datos',
            force: editForm.value.force
          }

          const response = await api.put(`/facturaciones/${editForm.value.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          // Handle Administrative PDF Upload if a file is chosen
          if (editForm.value.facturaFile) {
            const formData = new FormData()
            formData.append('factura', editForm.value.facturaFile)
            formData.append('comment', editForm.value.comment || 'Carga de PDF en edición administrativa')
            formData.append('force', editForm.value.force ? '1' : '0')

            await api.post(`/facturaciones/${editForm.value.id}/admin-upload`, formData, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            })
            $q.notify({ type: 'positive', message: 'PDF de Factura cargado administrativamente' })
          }

          $q.notify({ type: 'positive', message: 'Registro actualizado correctamente' })
        }

        editDialog.value = false
        loadFacturaciones()
      } catch (error) {
        $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al actualizar' })
      } finally {
        savingEdit.value = false
      }
    }

    // Print Package functions
    const openPrintPackageDialog = () => {
      const currentCorte = selectedCorte.value || null
      const currentSedeObj = allSedes.value.find(s => s.nombre === selectedSede.value?.value) || null
      const currentCarreraObj = allCarreras.value.find(c => c.nombre === selectedCarrera.value?.value) || null
      
      printForm.value = {
        corte: currentCorte,
        sede: currentSedeObj,
        carrera: currentCarreraObj,
        estado_subida: estadoSubida.value?.value || null
      }
      
      if (printForm.value.sede) {
        printAvailableCarreras.value = allCarreras.value
      } else {
        printAvailableCarreras.value = []
      }
      
      printPackageDialog.value = true
    }

    const onPrintSedeChange = (sede) => {
      printForm.value.carrera = null
      if (sede) {
        printAvailableCarreras.value = allCarreras.value
      } else {
        printAvailableCarreras.value = []
      }
    }

    const generatePrintPackage = async () => {
      if (!printForm.value.corte || !printForm.value.sede) {
        $q.notify({ type: 'warning', message: 'Por favor complete los filtros obligatorios (Corte, Sede)' })
        return
      }

      generatingPackage.value = true
      try {
        const token = localStorage.getItem('token')
        const payload = {
          corte_id: printForm.value.corte.id,
          sede_id: printForm.value.sede.id
        }

        if (printForm.value.carrera) {
          payload.carrera_id = printForm.value.carrera.id
        }
        
        if (printForm.value.estado_subida !== null) {
          payload.estado_subida = printForm.value.estado_subida
        }

        const response = await api.post('/facturaciones/print-package', payload, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        const carreraName = printForm.value.carrera ? printForm.value.carrera.nombre : 'Todas_las_Carreras'
        link.setAttribute('download', `Consolidado_${printForm.value.sede.nombre}_${carreraName}_${printForm.value.corte.nombre}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        $q.notify({ type: 'positive', message: 'PDF consolidado descargado con éxito' })
        printPackageDialog.value = false
      } catch (error) {
        console.error(error)
        $q.notify({ type: 'negative', message: 'Error al generar el PDF consolidado. Asegúrese de tener registros cargados.' })
      } finally {
        generatingPackage.value = false
      }
    }

    const openPublicPortal = () => {
      const resolved = router.resolve('/search')
      const url = new URL(resolved.href, window.location.href).href
      window.open(url, '_blank')
    }

    onMounted(() => {
      loadCortes()
      loadAllSedesAndCarreras()
    })

    return {
      facturaciones,
      cortes,
      selectedCorte,
      selectedSede,
      selectedCarrera,
      estadoSubida,
      loading,
      searchQuery,
      sedeOptions,
      carreraOptions,
      filteredFacturaciones,
      estadoOptions,
      columns,
      onSedeChange,
      formatDate,
      loadFacturaciones,
      previewFactura,
      previewDialog,
      previewUrl,
      currentPreviewFactura,
      downloadCurrentFactura,
      approveFactura,
      denyFactura,
      deleteFacturacion,
      exportToExcel,
      editDialog,
      isBulkEdit,
      editForm,
      selected,
      allSedes,
      availableCarreras,
      openBulkEditDialog,
      openSingleEditDialog,
      onEditSedeChange,
      saveEdit,
      savingEdit,
      printPackageDialog,
      generatingPackage,
      printForm,
      printAvailableCarreras,
      openPrintPackageDialog,
      onPrintSedeChange,
      generatePrintPackage,
      openPublicPortal
    }
  }
}
</script>
