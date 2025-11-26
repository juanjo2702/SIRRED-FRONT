<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="text-h5 text-weight-medium">Control de Afiliación y Retención</div>
            <div class="text-caption text-grey-7">Visualice y exporte las afiliaciones y retenciones de los docentes
            </div>
        </div>

        <q-card class="q-mb-md shadow-2" flat bordered>
            <q-card-section class="bg-grey-2">
                <div class="text-subtitle1 text-grey-8">Filtros</div>
            </q-card-section>

            <q-separator />

            <q-card-section>
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-2">
                        <q-select v-model="selectedCorte" :options="cortes" option-label="nombre" option-value="id"
                            label="Corte" outlined dense @update:model-value="loadFacturaciones">
                            <template v-slot:prepend>
                                <q-icon name="event" />
                            </template>
                        </q-select>
                    </div>

                    <div class="col-12 col-sm-6 col-md-2">
                        <q-select v-model="selectedTipoContrato" :options="tipoContratoOptions" label="Tipo de Contrato"
                            outlined dense @update:model-value="loadFacturaciones">
                            <template v-slot:prepend>
                                <q-icon name="description" />
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
                        <q-select v-model="selectedCarrera" :options="carreraOptions" label="Carrera" outlined dense
                            clearable>
                            <template v-slot:prepend>
                                <q-icon name="school" />
                            </template>
                        </q-select>
                    </div>



                    <div class="col-12 col-sm-12 col-md-4">
                        <q-input v-model="searchQuery" outlined dense placeholder="Buscar por nombre o CI..." clearable>
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
                {{ filteredFacturaciones.length }} registro(s) encontrado(s)
            </div>
            <q-btn color="positive" icon="download" label="Exportar a Excel" unelevated @click="exportToExcel"
                :disable="filteredFacturaciones.length === 0">
                <q-tooltip>Descargar datos filtrados en Excel</q-tooltip>
            </q-btn>
        </div>

        <q-table :rows="filteredFacturaciones" :columns="columns" row-key="id" :loading="loading" flat bordered
            :rows-per-page-options="[10, 25, 50, 100]" class="shadow-2">
            <template v-slot:body-cell-docente="props">
                <q-td :props="props">
                    <div>
                        <div class="text-weight-bold">{{ props.row.docente?.apellidos }}</div>
                        <div>{{ props.row.docente?.nombre }}</div>
                        <div class="text-caption text-grey-7">CI: {{ props.row.docente?.ci }}</div>
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
                    <q-badge :color="getTipoContratoColor(props.row.tipo_contrato)">
                        {{ props.row.tipo_contrato }}
                    </q-badge>
                </q-td>
            </template>


        </q-table>
    </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
    name: 'AffiliationRetentionPage',
    setup() {
        const $q = useQuasar()
        const facturaciones = ref([])
        const cortes = ref([])
        const selectedCorte = ref(null)
        const selectedTipoContrato = ref({ label: 'Todos', value: null })
        const selectedSede = ref(null)
        const selectedCarrera = ref(null)
        const loading = ref(false)
        const searchQuery = ref('')

        const tipoContratoOptions = [
            { label: 'Todos', value: null },
            { label: 'Afiliación', value: 'AFILIACION' },
            { label: 'Retención', value: 'RETENCION' }
        ]

        const columns = [
            { name: 'docente', label: 'Docente', align: 'left', sortable: true },
            { name: 'sede_carrera', label: 'Sede - Carrera', align: 'left' },
            { name: 'tipo_contrato', label: 'Tipo', field: 'tipo_contrato', align: 'center' },
            { name: 'monto', label: 'Monto', field: 'monto', align: 'right', format: val => `Bs. ${val}`, sortable: true },
            { name: 'carga_horaria', label: 'Carga', field: 'carga_horaria', align: 'center', sortable: true }
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

        const getTipoContratoColor = (tipo) => {
            switch (tipo) {
                case 'AFILIACION':
                    return 'purple'
                case 'RETENCION':
                    return 'orange'
                default:
                    return 'grey'
            }
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
                    corte_id: selectedCorte.value.id
                }

                // Add tipo_contrato filter - if "Todos", we need to fetch both AFILIACION and RETENCION
                if (selectedTipoContrato.value?.value) {
                    params.tipo_contrato = selectedTipoContrato.value.value
                } else {
                    // When "Todos" is selected, we'll fetch both types separately and combine
                    const [afiliacionResponse, retencionResponse] = await Promise.all([
                        api.get('/facturaciones', {
                            params: { ...params, tipo_contrato: 'AFILIACION' },
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        api.get('/facturaciones', {
                            params: { ...params, tipo_contrato: 'RETENCION' },
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    ])
                    facturaciones.value = [...afiliacionResponse.data, ...retencionResponse.data]
                    loading.value = false
                    return
                }

                const response = await api.get('/facturaciones', {
                    params,
                    headers: { Authorization: `Bearer ${token}` }
                })
                facturaciones.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar datos' })
            } finally {
                loading.value = false
            }
        }



        const exportToExcel = async () => {
            try {
                const token = localStorage.getItem('token')
                const params = {
                    corte_id: selectedCorte.value.id
                }

                // Add tipo_contrato filter
                if (selectedTipoContrato.value?.value) {
                    params.tipo_contrato = selectedTipoContrato.value.value
                }

                // Add sede filter
                if (selectedSede.value?.value) {
                    params.sede_nombre = selectedSede.value.value
                }

                // Add carrera filter
                if (selectedCarrera.value?.value) {
                    params.carrera_nombre = selectedCarrera.value.value
                }

                const response = await api.get('/facturaciones/export', {
                    params,
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                })

                // Create download link
                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url

                // Extract filename from response headers or use default
                const contentDisposition = response.headers['content-disposition']
                let filename = 'Afiliacion_Retencion_Export.xlsx'
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

        onMounted(() => {
            loadCortes()
        })

        return {
            facturaciones,
            cortes,
            selectedCorte,
            selectedTipoContrato,
            selectedSede,
            selectedCarrera,
            loading,
            searchQuery,
            tipoContratoOptions,
            sedeOptions,
            carreraOptions,
            filteredFacturaciones,
            columns,
            onSedeChange,
            getTipoContratoColor,
            loadFacturaciones,
            exportToExcel
        }
    }
}
</script>
