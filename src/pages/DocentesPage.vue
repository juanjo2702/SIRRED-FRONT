<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="row justify-between items-center q-mb-md">
                <div class="text-h5 text-weight-medium">Gestión de Docentes</div>
            </div>

            <!-- Filtros -->
            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                    <q-input
                        v-model="searchQuery"
                        outlined
                        dense
                        placeholder="Buscar por nombre, apellidos o CI..."
                        clearable
                    >
                        <template v-slot:prepend>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                    <q-select
                        v-model="filterTipoCompra"
                        :options="tipoCompraOptions"
                        outlined
                        dense
                        emit-value
                        map-options
                        label="Tipo de Compra"
                        clearable
                    />
                </div>

                <div class="col-12 col-sm-6 col-md-3">
                    <q-select
                        v-model="filterEstado"
                        :options="estadoOptions"
                        outlined
                        dense
                        emit-value
                        map-options
                        label="Estado"
                        clearable
                    />
                </div>
            </div>

            <!-- Estadísticas -->
            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-6 col-sm-3">
                    <q-card flat bordered class="text-center q-pa-sm">
                        <div class="text-h6 text-primary">{{ stats.total }}</div>
                        <div class="text-caption text-grey">Total Docentes</div>
                    </q-card>
                </div>
                <div class="col-6 col-sm-3">
                    <q-card flat bordered class="text-center q-pa-sm">
                        <div class="text-h6 text-info">{{ stats.tipo1 }}</div>
                        <div class="text-caption text-grey">Tipo Compra 1</div>
                    </q-card>
                </div>
                <div class="col-6 col-sm-3">
                    <q-card flat bordered class="text-center q-pa-sm">
                        <div class="text-h6 text-warning">{{ stats.tipo2 }}</div>
                        <div class="text-caption text-grey">Tipo Compra 2</div>
                    </q-card>
                </div>
                <div class="col-6 col-sm-3">
                    <q-card flat bordered class="text-center q-pa-sm">
                        <div class="text-h6 text-positive">{{ stats.activos }}</div>
                        <div class="text-caption text-grey">Activos</div>
                    </q-card>
                </div>
            </div>
        </div>

        <q-table
            :rows="filteredDocentes"
            :columns="columns"
            row-key="id"
            :loading="loading"
            flat
            bordered
            :rows-per-page-options="[10, 25, 50, 100]"
            class="shadow-1"
            :pagination="{ rowsPerPage: 25 }"
        >
            <template v-slot:body-cell-estado="props">
                <q-td :props="props">
                    <q-badge :color="props.row.estado ? 'positive' : 'negative'">
                        {{ props.row.estado ? 'Activo' : 'Inactivo' }}
                    </q-badge>
                </q-td>
            </template>

            <template v-slot:body-cell-tipo_compra="props">
                <q-td :props="props">
                    <q-badge :color="props.row.tipo_compra === 1 ? 'info' : 'warning'">
                        Tipo {{ props.row.tipo_compra }}
                    </q-badge>
                </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                    <q-btn flat dense color="primary" icon="edit" @click="openEditDialog(props.row)">
                        <q-tooltip>Editar Tipo de Compra</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>

        <!-- Diálogo de edición -->
        <q-dialog v-model="showEditDialog">
            <q-card style="min-width: 350px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">Editar Tipo de Compra</div>
                </q-card-section>

                <q-card-section>
                    <div class="q-mb-md">
                        <strong>Docente:</strong> {{ selectedDocente?.nombre }} {{ selectedDocente?.apellidos }}
                    </div>
                    <div class="q-mb-md">
                        <strong>CI:</strong> {{ selectedDocente?.ci }}
                    </div>

                    <q-select
                        v-model="editForm.tipo_compra"
                        :options="tipoCompraEditOptions"
                        outlined
                        dense
                        emit-value
                        map-options
                        label="Tipo de Compra"
                    />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn label="Cancelar" color="grey" flat @click="showEditDialog = false" />
                    <q-btn label="Guardar" color="primary" :loading="saving" @click="saveDocente" />
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
    name: 'DocentesPage',
    setup() {
        const $q = useQuasar()
        const docentes = ref([])
        const loading = ref(false)
        const saving = ref(false)
        const showEditDialog = ref(false)
        const selectedDocente = ref(null)
        const searchQuery = ref('')
        const filterTipoCompra = ref(null)
        const filterEstado = ref(null)
        const editForm = ref({ tipo_compra: 1 })

        const columns = [
            { name: 'ci', label: 'CI', field: 'ci', align: 'left', sortable: true },
            { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
            { name: 'apellidos', label: 'Apellidos', field: 'apellidos', align: 'left', sortable: true },
            { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
            { name: 'tipo_compra', label: 'Tipo de Compra', field: 'tipo_compra', align: 'center', sortable: true },
            { name: 'actions', label: 'Acciones', align: 'center' }
        ]

        const tipoCompraOptions = [
            { label: 'Tipo 1', value: 1 },
            { label: 'Tipo 2', value: 2 }
        ]

        const tipoCompraEditOptions = [
            { label: 'Tipo 1', value: 1 },
            { label: 'Tipo 2', value: 2 }
        ]

        const estadoOptions = [
            { label: 'Activo', value: 1 },
            { label: 'Inactivo', value: 0 }
        ]

        const filteredDocentes = computed(() => {
            let result = docentes.value

            // Filtro de búsqueda por texto
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase()
                result = result.filter(d =>
                    d.nombre?.toLowerCase().includes(query) ||
                    d.apellidos?.toLowerCase().includes(query) ||
                    d.ci?.toLowerCase().includes(query)
                )
            }

            // Filtro por tipo_compra
            if (filterTipoCompra.value !== null) {
                result = result.filter(d => d.tipo_compra === filterTipoCompra.value)
            }

            // Filtro por estado
            if (filterEstado.value !== null) {
                result = result.filter(d => d.estado === filterEstado.value)
            }

            return result
        })

        const stats = computed(() => {
            const all = docentes.value
            return {
                total: all.length,
                tipo1: all.filter(d => d.tipo_compra === 1).length,
                tipo2: all.filter(d => d.tipo_compra === 2).length,
                activos: all.filter(d => d.estado === 1).length
            }
        })

        const loadDocentes = async () => {
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/docentes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                docentes.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar docentes' })
            } finally {
                loading.value = false
            }
        }

        const openEditDialog = (docente) => {
            selectedDocente.value = docente
            editForm.value = { tipo_compra: docente.tipo_compra }
            showEditDialog.value = true
        }

        const saveDocente = async () => {
            saving.value = true
            try {
                const token = localStorage.getItem('token')
                await api.put(`/docentes/${selectedDocente.value.id}`, editForm.value, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                $q.notify({ type: 'positive', message: 'Tipo de compra actualizado correctamente' })
                showEditDialog.value = false
                loadDocentes()
            } catch (error) {
                $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al actualizar' })
            } finally {
                saving.value = false
            }
        }

        onMounted(() => {
            loadDocentes()
        })

        return {
            docentes,
            loading,
            saving,
            showEditDialog,
            selectedDocente,
            searchQuery,
            filterTipoCompra,
            filterEstado,
            editForm,
            columns,
            tipoCompraOptions,
            tipoCompraEditOptions,
            estadoOptions,
            filteredDocentes,
            stats,
            openEditDialog,
            saveDocente
        }
    }
}
</script>
