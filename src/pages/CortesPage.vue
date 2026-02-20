<template>
    <q-page padding>
        <div class="row items-center justify-between q-mb-lg">
            <div>
                <div class="text-h4 text-weight-bold text-dark tracking-tight">Gestión de Cortes</div>
                <div class="text-subtitle1 text-grey-7 q-mt-xs">Administración de periodos de facturación</div>
            </div>
             <div class="row q-gutter-sm items-center">
                <q-select
                    v-model="selectedGestion"
                    :options="gestiones"
                    option-label="nombre"
                    label="Gestión Académica"
                    outlined
                    dense
                    bg-color="white"
                    class="input-rounded shadow-1"
                    style="min-width: 200px"
                    @update:model-value="loadCortes"
                    :loading="loadingGestiones"
                >
                        <template v-slot:option="scope">
                        <q-item v-bind="scope.itemProps">
                            <q-item-section>
                                <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                                <q-item-label caption class="text-xs">
                                    {{ scope.opt.estado ? 'Activa' : 'Inactiva' }}
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side v-if="scope.opt.estado">
                                <q-icon name="check_circle" color="positive" size="xs" />
                            </q-item-section>
                        </q-item>
                    </template>
                </q-select>
                <q-btn
                    color="primary"
                    label="Nuevo Corte"
                    icon="add"
                    @click="openDialog()"
                    unelevated
                    class="btn-rounded shadow-2"
                    :disable="!selectedGestion"
                />
            </div>
        </div>

        <div class="glass-container q-pa-md">
            <div class="row justify-between items-center q-mb-md">
                 <q-input
                    v-model="searchQuery"
                    outlined
                    dense
                    placeholder="Buscar por nombre..."
                    class="input-rounded search-input"
                    bg-color="white"
                    clearable
                >
                    <template v-slot:prepend>
                        <q-icon name="search" color="grey-6" />
                    </template>
                </q-input>
            </div>

            <q-table
                :rows="filteredCortes"
                :columns="columns"
                row-key="id"
                :loading="loading"
                flat
                :rows-per-page-options="[10, 25, 50]"
                class="glass-table"
            >
                <template v-slot:header="props">
                    <q-tr :props="props">
                        <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-grey-8 text-weight-bold">
                            {{ col.label }}
                        </q-th>
                    </q-tr>
                </template>

                 <template v-slot:body-cell-nombre="props">
                    <q-td :props="props">
                        <div class="text-weight-bold text-dark">{{ props.row.nombre }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-estado="props">
                    <q-td :props="props">
                        <q-badge :color="props.row.estado ? 'positive' : 'grey-4'" :class="props.row.estado ? 'text-white shadow-1' : 'text-grey-7'" rounded>
                            {{ props.row.estado ? 'ACTIVO' : 'Inactivo' }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                         <div class="row justify-center q-gutter-x-sm">
                            <q-btn flat round color="primary" icon="edit" size="sm" class="btn-action" @click="openDialog(props.row)">
                                <q-tooltip>Editar</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                </template>

                 <template v-slot:no-data>
                    <div class="full-width column flex-center text-grey-8 q-pa-xl" v-if="!selectedGestion">
                        <q-icon name="school" size="48px" class="q-mb-md text-grey-4" />
                        <div class="text-h6 text-grey-6">Seleccione una gestión</div>
                        <div class="text-caption text-grey-5">Para ver los cortes disponibles</div>
                    </div>
                    <div class="full-width column flex-center text-grey-8 q-pa-xl" v-else>
                         <q-icon name="event_busy" size="48px" class="q-mb-md text-grey-4" />
                        <div class="text-h6 text-grey-6">No hay cortes encontrados</div>
                        <div class="text-caption text-grey-5">Intente ajustar los filtros o cree uno nuevo</div>
                    </div>
                </template>
            </q-table>
        </div>

        <q-dialog v-model="showDialog" backdrop-filter="blur(4px)">
            <q-card style="min-width: 500px; border-radius: 20px;">
                <q-card-section class="bg-gradient-primary text-white q-py-lg">
                    <div class="text-h6 text-weight-bold text-center">{{ editMode ? 'Editar Corte' : 'Nuevo Corte' }}</div>
                    <div class="text-caption text-center opacity-80" v-if="selectedGestion">
                        Gestión: {{ selectedGestion.nombre }}
                    </div>
                </q-card-section>

                <q-card-section class="q-pt-lg q-px-lg">
                    <q-form @submit="saveCorte" class="q-gutter-y-md">
                        <q-input
                            v-model="form.nombre"
                            label="Nombre del Corte"
                            outlined
                            dense
                            class="input-rounded"
                            :rules="[val => !!val || 'Requerido']"
                        />

                        <div class="row q-col-gutter-md">
                            <div class="col-6">
                                <q-input
                                    v-model="form.fecha_inicio"
                                    label="Inicio Corte"
                                    type="date"
                                    outlined
                                    dense
                                    class="input-rounded"
                                    :rules="[val => !!val || 'Requerido']"
                                />
                            </div>
                            <div class="col-6">
                                <q-input
                                    v-model="form.fecha_fin"
                                    label="Fin Corte"
                                    type="date"
                                    outlined
                                    dense
                                    class="input-rounded"
                                />
                            </div>
                        </div>

                        <q-separator class="q-my-sm" />

                        <div class="text-subtitle2 text-primary">Periodo de Facturación</div>

                        <div class="row q-col-gutter-md">
                             <div class="col-6">
                                <q-input
                                    v-model="form.fecha_inicio_facturacion"
                                    label="Inicio Facturación"
                                    type="date"
                                    outlined
                                    dense
                                    class="input-rounded"
                                    hint="Desde esta fecha"
                                />
                            </div>
                            <div class="col-6">
                                <q-input
                                    v-model="form.fecha_fin_facturacion"
                                    label="Fin Facturación"
                                    type="date"
                                    outlined
                                    dense
                                    class="input-rounded"
                                    hint="Hasta esta fecha"
                                />
                            </div>
                        </div>

                        <div class="bg-grey-1 q-pa-md rounded-borders q-mt-md">
                            <q-toggle
                                v-model="form.estado"
                                label="Activar este corte"
                                color="positive"
                                keep-color
                            />
                            <div v-if="form.estado" class="text-caption text-warning q-mt-sm">
                                <q-icon name="warning" class="q-mr-xs" />
                                Al activar, otros cortes se desactivarán.
                            </div>
                        </div>

                        <div class="row q-gutter-sm justify-end q-mt-lg">
                            <q-btn label="Cancelar" color="grey-7" flat class="btn-rounded" @click="showDialog = false" />
                            <q-btn type="submit" label="Guardar" color="primary" class="btn-rounded shadow-2" :loading="saving" unelevated />
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
    name: 'CortesPage',
    setup() {
        const $q = useQuasar()
        const cortes = ref([])
        const gestiones = ref([])
        const selectedGestion = ref(null)
        const loading = ref(false)
        const loadingGestiones = ref(false)
        const saving = ref(false)
        const showDialog = ref(false)
        const editMode = ref(false)
        const form = ref({ nombre: '', fecha_inicio: '', fecha_fin: '', estado: false, fecha_inicio_facturacion: '', fecha_fin_facturacion: '' })
        const searchQuery = ref('')

        const formatDate = (dateString) => {
            if (!dateString) return ''
            let date
            if (dateString.includes('T')) {
                date = new Date(dateString)
            } else {
                date = new Date(dateString + 'T00:00:00')
            }
            if (isNaN(date.getTime())) return ''
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
        }

        const columns = [
            { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
             {
                name: 'gestion',
                label: 'GESTIÓN',
                field: row => row.gestion?.nombre || 'N/A',
                align: 'left',
                sortable: true
            },
            {
                name: 'fecha_inicio',
                label: 'INICIO',
                field: 'fecha_inicio',
                align: 'left',
                sortable: true,
                format: val => formatDate(val)
            },
            {
                name: 'fecha_fin',
                label: 'FIN',
                field: 'fecha_fin',
                align: 'left',
                sortable: true,
                format: val => formatDate(val)
            },
            {
                name: 'periodo_facturacion',
                label: 'FACTURACIÓN',
                align: 'left',
                format: (val, row) => {
                    if (!row.fecha_inicio_facturacion || !row.fecha_fin_facturacion) return 'No definido'
                    return `${formatDate(row.fecha_inicio_facturacion)} - ${formatDate(row.fecha_fin_facturacion)}`
                }
            },
            { name: 'estado', label: 'ESTADO', field: 'estado', align: 'center' },
            { name: 'actions', label: 'ACCIONES', align: 'center' }
        ]

        const filteredCortes = computed(() => {
            if (!searchQuery.value) return cortes.value

            const query = searchQuery.value.toLowerCase()
            return cortes.value.filter(corte =>
                corte.nombre?.toLowerCase().includes(query) ||
                corte.fecha_inicio?.toLowerCase().includes(query) ||
                corte.fecha_fin?.toLowerCase().includes(query)
            )
        })

        const loadGestiones = async () => {
            loadingGestiones.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/gestiones', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                gestiones.value = response.data

                // Auto-select active gestion or first one
                if (gestiones.value.length > 0) {
                    const active = gestiones.value.find(g => g.estado)
                    selectedGestion.value = active || gestiones.value[0]
                    loadCortes()
                }
            } catch (error) {
                console.error(error)
                $q.notify({ type: 'negative', message: 'Error al cargar gestiones' })
            } finally {
                loadingGestiones.value = false
            }
        }

        const loadCortes = async () => {
            if (!selectedGestion.value) {
                cortes.value = []
                return
            }

            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/cortes', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { gestion_id: selectedGestion.value.id }
                })
                cortes.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar cortes' })
            } finally {
                loading.value = false
            }
        }

        watch(selectedGestion, (newVal) => {
            if (newVal) loadCortes()
        })

        // Helper to format date for input[type="date"]
        const formatDateForInput = (dateString) => {
            if (!dateString) return ''
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return ''
            return date.toISOString().split('T')[0]
        }

        const openDialog = (corte = null) => {
            if (corte) {
                form.value = {
                    ...corte,
                    estado: Boolean(corte.estado),
                    fecha_inicio: formatDateForInput(corte.fecha_inicio),
                    fecha_fin: formatDateForInput(corte.fecha_fin),
                    fecha_inicio_facturacion: formatDateForInput(corte.fecha_inicio_facturacion),
                    fecha_fin_facturacion: formatDateForInput(corte.fecha_fin_facturacion)
                }
                editMode.value = true
            } else {
                form.value = {
                    nombre: '',
                    fecha_inicio: '',
                    fecha_fin: '',
                    estado: false,
                    fecha_inicio_facturacion: '',
                    fecha_fin_facturacion: ''
                }
                editMode.value = false
            }
            showDialog.value = true
        }

        const saveCorte = async () => {
            if (!selectedGestion.value) {
                $q.notify({ type: 'warning', message: 'Seleccione una gestión primero' })
                return
            }

            saving.value = true
            try {
                const token = localStorage.getItem('token')
                const payload = {
                    ...form.value,
                    estado: form.value.estado ? 1 : 0,
                    gestion_id: selectedGestion.value.id
                }

                if (editMode.value) {
                    await api.put(`/cortes/${form.value.id}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Corte actualizado' })
                } else {
                    await api.post('/cortes', payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Corte creado' })
                }
                showDialog.value = false
                loadCortes()
            } catch (error) {
                $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al guardar' })
            } finally {
                saving.value = false
            }
        }

        onMounted(() => {
            loadGestiones()
        })

        return {
            cortes,
            gestiones,
            selectedGestion,
            loading,
            loadingGestiones,
            saving,
            showDialog,
            editMode,
            form,
            columns,
            searchQuery,
            filteredCortes,
            openDialog,
            saveCorte,
            loadCortes
        }
    }
}
</script>

<style scoped lang="scss">
.tracking-tight {
    letter-spacing: -0.5px;
}

.glass-container {
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.05);
}

.search-input {
    width: 300px;
}

.glass-table {
    border-radius: 12px;

    :deep(.q-table__top) {
        background: transparent;
    }

    :deep(thead tr th) {
        position: sticky;
        top: 0;
        z-index: 1;
        background: white;
    }
}

.btn-rounded {
    border-radius: 12px;
}

.btn-action {
    transition: transform 0.2s;
    &:hover {
        transform: scale(1.1);
    }
}

.bg-gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.input-rounded :deep(.q-field__control) {
    border-radius: 12px;
}
</style>
