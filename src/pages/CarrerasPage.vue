<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="row justify-between items-center q-mb-md">
                <div class="text-h5 text-weight-medium">Gestión de Carreras</div>
                <q-btn color="primary" label="Nueva Carrera" icon="add" @click="openDialog()" unelevated />
            </div>

            <q-input v-model="searchQuery" outlined dense placeholder="Buscar por nombre..." class="q-mb-md" clearable
                style="max-width: 400px">
                <template v-slot:prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </div>

        <q-table :rows="filteredCarreras" :columns="columns" row-key="id" :loading="loading" flat bordered
            :rows-per-page-options="[10, 25, 50]" class="shadow-1">
            <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                    <q-btn flat dense color="primary" icon="edit" @click="openDialog(props.row)">
                        <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="showDialog">
            <q-card style="min-width: 400px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">{{ editMode ? 'Editar Carrera' : 'Nueva Carrera' }}</div>
                </q-card-section>

                <q-card-section>
                    <q-form @submit="saveCarrera">
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
    </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
    name: 'CarrerasPage',
    setup() {
        const $q = useQuasar()
        const carreras = ref([])
        const loading = ref(false)
        const saving = ref(false)
        const showDialog = ref(false)
        const editMode = ref(false)
        const form = ref({ nombre: '' })
        const searchQuery = ref('')

        const columns = [
            { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
            { name: 'actions', label: 'Acciones', align: 'center' }
        ]

        const filteredCarreras = computed(() => {
            if (!searchQuery.value) return carreras.value

            const query = searchQuery.value.toLowerCase()
            return carreras.value.filter(carrera =>
                carrera.nombre?.toLowerCase().includes(query)
            )
        })

        const loadCarreras = async () => {
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/carreras', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                carreras.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar carreras' })
            } finally {
                loading.value = false
            }
        }

        const openDialog = (carrera = null) => {
            if (carrera) {
                form.value = { ...carrera }
                editMode.value = true
            } else {
                form.value = { nombre: '' }
                editMode.value = false
            }
            showDialog.value = true
        }

        const saveCarrera = async () => {
            saving.value = true
            try {
                const token = localStorage.getItem('token')
                if (editMode.value) {
                    await api.put(`/carreras/${form.value.id}`, form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Carrera actualizada' })
                } else {
                    await api.post('/carreras', form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Carrera creada' })
                }
                showDialog.value = false
                loadCarreras()
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al guardar' })
            } finally {
                saving.value = false
            }
        }

        onMounted(() => {
            loadCarreras()
        })

        return {
            carreras,
            loading,
            saving,
            showDialog,
            editMode,
            form,
            columns,
            searchQuery,
            filteredCarreras,
            openDialog,
            saveCarrera
        }
    }
}
</script>
