<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="row justify-between items-center q-mb-md">
                <div>
                    <div class="text-h5 text-weight-medium">Gestión Académica / Anual</div>
                    <div class="text-caption text-grey-7">Administre las gestiones y consulte los cortes asociados</div>
                </div>
                <q-btn color="primary" label="Nueva Gestión" icon="add" @click="openDialog()" unelevated />
            </div>

            <q-input
                v-model="searchQuery"
                outlined
                dense
                placeholder="Buscar por nombre o descripción..."
                class="q-mb-md"
                clearable
                style="max-width: 400px"
            >
                <template v-slot:prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </div>

        <q-table
            :rows="filteredGestiones"
            :columns="columns"
            row-key="id"
            :loading="loading"
            flat
            bordered
            :rows-per-page-options="[10, 25, 50]"
            class="shadow-1"
        >
            <template v-slot:body-cell-estado="props">
                <q-td :props="props">
                    <q-badge :color="props.row.estado ? 'positive' : 'grey'">
                        {{ props.row.estado ? 'ACTIVO' : 'Inactivo' }}
                    </q-badge>
                </q-td>
            </template>

            <template v-slot:body-cell-cortes_count="props">
                <q-td :props="props">
                    <q-chip dense color="blue-1" text-color="primary" icon="event">
                        {{ props.row.cortes_count || 0 }} corte(s)
                    </q-chip>
                </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="q-gutter-xs">
                    <q-btn flat dense round color="info" icon="visibility" @click="viewCortes(props.row)">
                        <q-tooltip>Ver Cortes de esta Gestión</q-tooltip>
                    </q-btn>
                    <q-btn flat dense round color="primary" icon="edit" @click="openDialog(props.row)">
                        <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn flat dense round color="negative" icon="delete" @click="confirmDelete(props.row)">
                        <q-tooltip>Eliminar</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>

        <!-- Diálogo Crear/Editar Gestión -->
        <q-dialog v-model="showDialog">
            <q-card style="min-width: 400px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">{{ editMode ? 'Editar Gestión' : 'Nueva Gestión' }}</div>
                </q-card-section>

                <q-card-section>
                    <q-form @submit="saveGestion">
                        <q-input
                            v-model="form.nombre"
                            label="Nombre de la Gestión (ej. 1/2026, 2026)"
                            outlined
                            dense
                            class="q-mb-md"
                            :rules="[val => !!val || 'El nombre es requerido']"
                        />
                        <q-input
                            v-model="form.descripcion"
                            label="Descripción (opcional)"
                            outlined
                            dense
                            class="q-mb-md"
                        />
                        <q-toggle
                            v-model="form.estado"
                            label="Gestión Activa"
                            color="positive"
                            class="q-mb-md"
                        />

                        <div class="row justify-end q-gutter-sm">
                            <q-btn label="Cancelar" color="grey" flat @click="showDialog = false" />
                            <q-btn type="submit" label="Guardar" color="primary" :loading="saving" unelevated />
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Diálogo Ver Cortes de la Gestión -->
        <q-dialog v-model="showCortesDialog">
            <q-card style="min-width: 600px; max-width: 90vw;">
                <q-card-section class="bg-dark text-white row items-center justify-between">
                    <div>
                        <div class="text-h6">Cortes de la Gestión: {{ selectedGestion?.nombre }}</div>
                        <div class="text-caption text-grey-4">{{ selectedGestion?.descripcion || 'Sin descripción' }}</div>
                    </div>
                    <q-btn flat round dense icon="close" v-close-popup />
                </q-card-section>

                <q-card-section class="q-pa-none">
                    <q-table
                        :rows="gestionCortes"
                        :columns="cortesColumns"
                        row-key="id"
                        :loading="loadingCortes"
                        flat
                        :rows-per-page-options="[10, 25]"
                    >
                        <template v-slot:body-cell-tipo_corte="props">
                            <q-td :props="props">
                                <q-badge :color="props.row.tipo_corte === 'PRACTICA' ? 'purple' : 'teal'">
                                    {{ props.row.tipo_corte }}
                                </q-badge>
                            </q-td>
                        </template>

                        <template v-slot:body-cell-estado="props">
                            <q-td :props="props">
                                <q-badge :color="props.row.estado ? 'positive' : 'grey'">
                                    {{ props.row.estado ? 'ACTIVO' : 'Inactivo' }}
                                </q-badge>
                            </q-td>
                        </template>

                        <template v-slot:no-data>
                            <div class="full-width text-center q-pa-md text-grey">
                                No hay cortes vinculados a esta gestión.
                            </div>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
    name: 'GestionesPage',
    setup() {
        const $q = useQuasar()
        const gestiones = ref([])
        const loading = ref(false)
        const saving = ref(false)
        const showDialog = ref(false)
        const editMode = ref(false)
        const form = ref({ id: null, nombre: '', descripcion: '', estado: true })
        const searchQuery = ref('')

        // Visualizador de cortes
        const showCortesDialog = ref(false)
        const selectedGestion = ref(null)
        const gestionCortes = ref([])
        const loadingCortes = ref(false)

        const columns = [
            { name: 'nombre', label: 'Gestión', field: 'nombre', align: 'left', sortable: true },
            { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
            { name: 'cortes_count', label: 'Cortes Asociados', field: 'cortes_count', align: 'center', sortable: true },
            { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
            { name: 'actions', label: 'Acciones', align: 'center' }
        ]

        const cortesColumns = [
            { name: 'nombre', label: 'Nombre del Corte', field: 'nombre', align: 'left', sortable: true },
            { name: 'tipo_corte', label: 'Tipo', field: 'tipo_corte', align: 'center' },
            { name: 'fecha_inicio', label: 'Fecha Inicio', field: 'fecha_inicio', align: 'center', sortable: true },
            { name: 'fecha_fin', label: 'Fecha Fin', field: 'fecha_fin', align: 'center', sortable: true, format: val => val || 'Indefinida' },
            { name: 'estado', label: 'Estado', field: 'estado', align: 'center' }
        ]

        const filteredGestiones = computed(() => {
            if (!searchQuery.value) return gestiones.value
            const q = searchQuery.value.toLowerCase()
            return gestiones.value.filter(g =>
                (g.nombre && g.nombre.toLowerCase().includes(q)) ||
                (g.descripcion && g.descripcion.toLowerCase().includes(q))
            )
        })

        const loadGestiones = async () => {
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/gestiones', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                gestiones.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar gestiones' })
            } finally {
                loading.value = false
            }
        }

        const openDialog = (gestion = null) => {
            if (gestion) {
                editMode.value = true
                form.value = {
                    id: gestion.id,
                    nombre: gestion.nombre,
                    descripcion: gestion.descripcion,
                    estado: Boolean(gestion.estado)
                }
            } else {
                editMode.value = false
                form.value = {
                    id: null,
                    nombre: '',
                    descripcion: '',
                    estado: true
                }
            }
            showDialog.value = true
        }

        const saveGestion = async () => {
            saving.value = true
            try {
                const token = localStorage.getItem('token')
                if (editMode.value) {
                    await api.put(`/gestiones/${form.value.id}`, form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Gestión actualizada correctamente' })
                } else {
                    await api.post('/gestiones', form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Gestión creada correctamente' })
                }
                showDialog.value = false
                loadGestiones()
            } catch (error) {
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al guardar la gestión'
                })
            } finally {
                saving.value = false
            }
        }

        const confirmDelete = (gestion) => {
            $q.dialog({
                title: 'Confirmar Eliminación',
                message: `¿Está seguro de eliminar la gestión "${gestion.nombre}"?`,
                cancel: true,
                persistent: true
            }).onOk(async () => {
                try {
                    const token = localStorage.getItem('token')
                    await api.delete(`/gestiones/${gestion.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Gestión eliminada' })
                    loadGestiones()
                } catch (error) {
                    $q.notify({
                        type: 'negative',
                        message: error.response?.data?.message || 'Error al eliminar la gestión'
                    })
                }
            })
        }

        const viewCortes = async (gestion) => {
            selectedGestion.value = gestion
            showCortesDialog.value = true
            loadingCortes.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get(`/gestiones/${gestion.id}/cortes`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                gestionCortes.value = response.data.cortes || []
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al consultar cortes de la gestión' })
            } finally {
                loadingCortes.value = false
            }
        }

        onMounted(() => {
            loadGestiones()
        })

        return {
            gestiones,
            loading,
            saving,
            showDialog,
            editMode,
            form,
            searchQuery,
            columns,
            cortesColumns,
            filteredGestiones,
            showCortesDialog,
            selectedGestion,
            gestionCortes,
            loadingCortes,
            openDialog,
            saveGestion,
            confirmDelete,
            viewCortes
        }
    }
}
</script>
