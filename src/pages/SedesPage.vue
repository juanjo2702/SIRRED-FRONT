<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="row justify-between items-center q-mb-md">
                <div class="text-h5 text-weight-medium">Gestión de Sedes</div>
                <q-btn color="primary" label="Nueva Sede" icon="add" @click="openDialog()" unelevated />
            </div>

            <q-input
                v-model="searchQuery"
                outlined
                dense
                placeholder="Buscar por nombre de sede..."
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
            :rows="filteredSedes"
            :columns="columns"
            row-key="id"
            :loading="loading"
            flat
            bordered
            :rows-per-page-options="[10, 25, 50]"
            class="shadow-1"
        >
            <template v-slot:body-cell-carreras="props">
                <q-td :props="props">
                    <div class="row items-center q-gutter-xs">
                        <q-badge
                            color="secondary"
                            :label="`${props.row.sede_carreras?.length || 0} carreras`"
                            class="q-px-sm"
                        />
                        <q-btn
                            v-if="props.row.sede_carreras?.length > 0"
                            flat
                            dense
                            round
                            size="sm"
                            color="grey-7"
                            icon="visibility"
                            @click="props.expand = !props.expand"
                        >
                            <q-tooltip>{{ props.expand ? 'Ocultar' : 'Ver' }} carreras</q-tooltip>
                        </q-btn>
                    </div>
                </q-td>
            </template>

            <template v-slot:body-cell-expand="props">
                <q-td :props="props" auto-width>
                    <q-btn
                        v-if="props.row.sede_carreras?.length > 0"
                        size="sm"
                        color="grey-7"
                        round
                        dense
                        @click="props.expand = !props.expand"
                        :icon="props.expand ? 'expand_less' : 'expand_more'"
                    />
                </q-td>
            </template>

            <template v-slot:body="props">
                <q-tr :props="props">
                    <q-td key="nombre" :props="props">
                        {{ props.row.nombre }}
                    </q-td>
                    <q-td key="carreras" :props="props">
                        <div class="row items-center q-gutter-xs">
                            <q-badge
                                color="secondary"
                                :label="`${props.row.sede_carreras?.length || 0} carreras`"
                                class="q-px-sm"
                            />
                            <q-btn
                                v-if="props.row.sede_carreras?.length > 0"
                                flat
                                dense
                                round
                                size="sm"
                                color="grey-7"
                                icon="visibility"
                                @click="props.expand = !props.expand"
                            >
                                <q-tooltip>{{ props.expand ? 'Ocultar' : 'Ver' }} carreras</q-tooltip>
                            </q-btn>
                        </div>
                    </q-td>
                    <q-td key="actions" :props="props">
                        <q-btn flat dense color="primary" icon="edit" @click="openDialog(props.row)">
                            <q-tooltip>Editar</q-tooltip>
                        </q-btn>
                        <q-btn flat dense color="secondary" icon="link" @click="manageCarreras(props.row)">
                            <q-tooltip>Gestionar Carreras</q-tooltip>
                        </q-btn>
                    </q-td>
                </q-tr>
                <q-tr v-show="props.expand" :props="props">
                    <q-td colspan="100%">
                        <div class="q-pa-md bg-grey-1">
                            <div class="text-subtitle2 text-grey-8 q-mb-sm">Carreras asignadas:</div>
                            <div class="row q-gutter-xs">
                                <q-chip
                                    v-for="sc in props.row.sede_carreras"
                                    :key="sc.id"
                                    color="secondary"
                                    text-color="white"
                                    size="sm"
                                    dense
                                >
                                    {{ sc.carrera?.nombre }}
                                </q-chip>
                            </div>
                        </div>
                    </q-td>
                </q-tr>
            </template>
        </q-table>

        <q-dialog v-model="showDialog">
            <q-card style="min-width: 400px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">{{ editMode ? 'Editar Sede' : 'Nueva Sede' }}</div>
                </q-card-section>

                <q-card-section>
                    <q-form @submit="saveSede">
                        <q-input v-model="form.nombre" label="Nombre" outlined dense class="q-mb-md"
                            :rules="[val => !!val || 'Requerido']" />

                        <div class="row q-gutter-sm">
                            <q-btn label="Cancelar" color="grey" flat @click="showDialog = false" />
                            <q-btn type="submit" label="Guardar" color="primary" :loading="saving" />
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

        <q-dialog v-model="showCarrerasDialog">
            <q-card style="min-width: 500px; max-width: 600px">
                <q-card-section class="bg-secondary text-white">
                    <div class="text-h6">Carreras de {{ selectedSede?.nombre }}</div>
                    <div class="text-caption">Seleccione las carreras disponibles en esta sede</div>
                </q-card-section>

                <q-card-section class="q-pt-md" style="max-height: 400px; overflow-y: auto">
                    <q-list>
                        <q-item
                            v-for="carrera in carreras"
                            :key="carrera.id"
                            tag="label"
                            clickable
                            v-ripple
                        >
                            <q-item-section avatar>
                                <q-checkbox
                                    v-model="selectedCarreras"
                                    :val="carrera.id"
                                    color="secondary"
                                />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ carrera.nombre }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>

                    <q-separator class="q-my-md" />

                    <div class="text-body2 text-grey-7">
                        <q-icon name="info" size="18px" class="q-mr-xs" />
                        {{ selectedCarreras.length }} de {{ carreras.length }} carreras seleccionadas
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pa-md">
                    <q-btn
                        label="Cancelar"
                        color="grey-7"
                        flat
                        @click="closeCarrerasDialog"
                    />
                    <q-btn
                        label="Guardar"
                        color="secondary"
                        @click="syncCarreras"
                        :loading="saving"
                        unelevated
                    />
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
    name: 'SedesPage',
    setup() {
        const $q = useQuasar()
        const sedes = ref([])
        const carreras = ref([])
        const loading = ref(false)
        const saving = ref(false)
        const showDialog = ref(false)
        const showCarrerasDialog = ref(false)
        const editMode = ref(false)
        const form = ref({ nombre: '' })
        const selectedSede = ref(null)
        const selectedCarreras = ref([])
        const searchQuery = ref('')

        const columns = [
            { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
            { name: 'carreras', label: 'Carreras', align: 'left' },
            { name: 'actions', label: 'Acciones', align: 'center' }
        ]

        const filteredSedes = computed(() => {
            if (!searchQuery.value) return sedes.value

            const query = searchQuery.value.toLowerCase()
            return sedes.value.filter(sede =>
                sede.nombre?.toLowerCase().includes(query)
            )
        })



        const loadSedes = async () => {
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/sedes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                sedes.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar sedes' })
            } finally {
                loading.value = false
            }
        }

        const loadCarreras = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/carreras', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                carreras.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar carreras' })
            }
        }

        const openDialog = (sede = null) => {
            if (sede) {
                form.value = { ...sede }
                editMode.value = true
            } else {
                form.value = { nombre: '' }
                editMode.value = false
            }
            showDialog.value = true
        }

        const saveSede = async () => {
            saving.value = true
            try {
                const token = localStorage.getItem('token')
                if (editMode.value) {
                    await api.put(`/sedes/${form.value.id}`, form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Sede actualizada' })
                } else {
                    await api.post('/sedes', form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Sede creada' })
                }
                showDialog.value = false
                loadSedes()
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al guardar' })
            } finally {
                saving.value = false
            }
        }

        const manageCarreras = (sede) => {
            selectedSede.value = sede
            // Pre-select currently assigned carreras
            selectedCarreras.value = sede.sede_carreras?.map(sc => sc.carrera_id) || []
            showCarrerasDialog.value = true
        }

        const syncCarreras = async () => {
            if (!selectedSede.value) return

            saving.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.post(
                    `/sedes/${selectedSede.value.id}/sync-carreras`,
                    { carrera_ids: selectedCarreras.value },
                    { headers: { Authorization: `Bearer ${token}` } }
                )

                // Update the sede in the list
                const index = sedes.value.findIndex(s => s.id === selectedSede.value.id)
                if (index !== -1) {
                    sedes.value[index] = response.data
                }

                $q.notify({ type: 'positive', message: 'Carreras actualizadas correctamente' })
                closeCarrerasDialog()
            } catch (error) {
                const message = error.response?.data?.message || 'Error al actualizar carreras'
                $q.notify({ type: 'negative', message })
            } finally {
                saving.value = false
            }
        }


        const closeCarrerasDialog = () => {
            showCarrerasDialog.value = false
            selectedSede.value = null
            selectedCarreras.value = []
        }

        onMounted(() => {
            loadSedes()
            loadCarreras()
        })

        return {
            sedes,
            carreras,
            loading,
            saving,
            showDialog,
            showCarrerasDialog,
            editMode,
            form,
            columns,
            selectedSede,
            selectedCarreras,
            searchQuery,
            filteredSedes,
            openDialog,
            saveSede,
            manageCarreras,
            syncCarreras,
            closeCarrerasDialog
        }
    }
}
</script>
