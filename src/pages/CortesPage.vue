<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="row justify-between items-center q-mb-md">
                <div class="text-h5 text-weight-medium">Gestión de Cortes</div>
                <q-btn color="primary" label="Nuevo Corte" icon="add" @click="openDialog()" unelevated />
            </div>

            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                    <q-input
                        v-model="searchQuery"
                        outlined
                        dense
                        placeholder="Buscar por nombre o fecha..."
                        clearable
                    >
                        <template v-slot:prepend>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                    <q-select
                        v-model="selectedGestionFilter"
                        :options="gestionFilterOptions"
                        option-label="label"
                        option-value="value"
                        label="Filtrar por Gestión"
                        outlined
                        dense
                        clearable
                    >
                        <template v-slot:prepend>
                            <q-icon name="calendar_month" />
                        </template>
                    </q-select>
                </div>
            </div>
        </div>

        <q-table
            :rows="filteredCortes"
            :columns="columns"
            row-key="id"
            :loading="loading"
            flat
            bordered
            :rows-per-page-options="[10, 25, 50]"
            class="shadow-1"
        >
            <template v-slot:body-cell-gestion="props">
                <q-td :props="props">
                    <q-badge v-if="props.row.gestion" color="indigo-7" class="text-weight-bold">
                        {{ props.row.gestion.nombre }}
                    </q-badge>
                    <span v-else class="text-grey-6 text-caption">Sin gestión</span>
                </q-td>
            </template>

            <template v-slot:body-cell-estado="props">
                <q-td :props="props">
                    <q-badge :color="props.row.estado ? 'positive' : 'grey'">
                        {{ props.row.estado ? 'ACTIVO' : 'Inactivo' }}
                    </q-badge>
                </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                    <q-btn flat dense color="primary" icon="edit" @click="openDialog(props.row)">
                        <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="showDialog">
            <q-card style="min-width: 420px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">{{ editMode ? 'Editar Corte' : 'Nuevo Corte' }}</div>
                </q-card-section>

                <q-card-section>
                    <q-form @submit="saveCorte">
                        <q-select
                            v-model="form.gestion_id"
                            :options="gestiones"
                            option-label="nombre"
                            option-value="id"
                            emit-value
                            map-options
                            label="Gestión Académica"
                            outlined
                            dense
                            class="q-mb-md"
                            clearable
                        >
                            <template v-slot:prepend>
                                <q-icon name="calendar_month" />
                            </template>
                        </q-select>

                        <q-input v-model="form.nombre" label="Nombre del Corte" outlined dense class="q-mb-md"
                            :rules="[val => !!val || 'Requerido']" />
                        <q-input v-model="form.fecha_inicio" label="Fecha de Inicio" type="date" outlined dense
                            class="q-mb-md" :rules="[val => !!val || 'Requerido']" />
                        <q-input v-model="form.fecha_fin" label="Fecha de Fin" type="date" outlined dense
                            class="q-mb-md" />
                        <q-toggle v-model="form.estado" label="Activar este corte" color="positive" class="q-mb-md" />
                        <q-banner v-if="form.estado" class="bg-warning text-white q-mb-md">
                            <template v-slot:avatar>
                                <q-icon name="warning" />
                            </template>
                            Al activar este corte, todos los demás se desactivarán automáticamente.
                        </q-banner>

                        <div class="row justify-end q-gutter-sm">
                            <q-btn label="Cancelar" color="grey" flat @click="showDialog = false" />
                            <q-btn type="submit" label="Guardar" color="primary" :loading="saving" unelevated />
                        </div>
                    </q-form>
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
    name: 'CortesPage',
    setup() {
        const $q = useQuasar()
        const cortes = ref([])
        const gestiones = ref([])
        const selectedGestionFilter = ref(null)
        const loading = ref(false)
        const saving = ref(false)
        const showDialog = ref(false)
        const editMode = ref(false)
        const form = ref({ id: null, gestion_id: null, nombre: '', fecha_inicio: '', fecha_fin: '', estado: false })
        const searchQuery = ref('')

        const formatDate = (dateString) => {
            if (!dateString) return ''
            const date = new Date(dateString + 'T00:00:00')
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
        }

        const columns = [
            { name: 'gestion', label: 'Gestión', field: row => row.gestion?.nombre || '', align: 'center', sortable: true },
            { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
            {
                name: 'fecha_inicio',
                label: 'Fecha Inicio',
                field: 'fecha_inicio',
                align: 'center',
                sortable: true,
                format: val => formatDate(val)
            },
            {
                name: 'fecha_fin',
                label: 'Fecha Fin',
                field: 'fecha_fin',
                align: 'center',
                sortable: true,
                format: val => formatDate(val) || 'Indefinida'
            },
            { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
            { name: 'actions', label: 'Acciones', align: 'center' }
        ]

        const gestionFilterOptions = computed(() => {
            return [
                { label: 'Todas las gestiones', value: null },
                ...gestiones.value.map(g => ({ label: g.nombre, value: g.id }))
            ]
        })

        const filteredCortes = computed(() => {
            let result = cortes.value

            if (selectedGestionFilter.value && selectedGestionFilter.value.value !== null) {
                result = result.filter(c => c.gestion_id === selectedGestionFilter.value.value)
            }

            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase()
                result = result.filter(corte =>
                    corte.nombre?.toLowerCase().includes(query) ||
                    corte.gestion?.nombre?.toLowerCase().includes(query) ||
                    corte.fecha_inicio?.toLowerCase().includes(query) ||
                    corte.fecha_fin?.toLowerCase().includes(query)
                )
            }

            return result
        })

        const loadCortes = async () => {
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/cortes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                cortes.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar cortes' })
            } finally {
                loading.value = false
            }
        }

        const loadGestiones = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/gestiones', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                gestiones.value = response.data
            } catch (error) {
                console.error('Error al cargar gestiones', error)
            }
        }

        const openDialog = (corte = null) => {
            if (corte) {
                form.value = {
                    id: corte.id,
                    gestion_id: corte.gestion_id || null,
                    nombre: corte.nombre,
                    fecha_inicio: corte.fecha_inicio,
                    fecha_fin: corte.fecha_fin,
                    estado: Boolean(corte.estado)
                }
                editMode.value = true
            } else {
                form.value = {
                    id: null,
                    gestion_id: null,
                    nombre: '',
                    fecha_inicio: '',
                    fecha_fin: '',
                    estado: false
                }
                editMode.value = false
            }
            showDialog.value = true
        }

        const saveCorte = async () => {
            saving.value = true
            try {
                const token = localStorage.getItem('token')
                const payload = {
                    ...form.value,
                    estado: form.value.estado ? 1 : 0
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
            loadCortes()
            loadGestiones()
        })

        return {
            cortes,
            gestiones,
            selectedGestionFilter,
            gestionFilterOptions,
            loading,
            saving,
            showDialog,
            editMode,
            form,
            columns,
            searchQuery,
            filteredCortes,
            openDialog,
            saveCorte
        }
    }
}
</script>
