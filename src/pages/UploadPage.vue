<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="text-h5 text-weight-medium">Subir Datos de Docentes</div>
            <div class="text-caption text-grey-7">Cargue la información de docentes mediante archivo Excel</div>
        </div>

        <q-card class="q-mb-md shadow-2" flat bordered>
            <q-card-section class="bg-teal text-white">
                <div class="row items-center">
                    <q-icon name="event" size="28px" class="q-mr-sm" />
                    <div>
                        <div class="text-subtitle2">Corte Activo</div>
                        <div class="text-h6">{{ corteActivo?.nombre || 'Ninguno' }}</div>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <q-card class="shadow-2" flat bordered>
            <q-card-section class="bg-grey-2">
                <div class="text-h6 text-grey-8">Información de Carga</div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-md">
                <q-form @submit="uploadExcel">
                    <div class="row q-col-gutter-md">
                        <div class="col-12 col-md-6">
                            <q-select
                                v-model="selectedSede"
                                :options="sedes"
                                option-label="nombre"
                                option-value="id"
                                label="Seleccionar Sede"
                                outlined
                                @update:model-value="loadCarrerasBySede"
                                :rules="[val => !!val || 'Requerido']"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="location_city" />
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <q-select
                                v-model="selectedCarrera"
                                :options="filteredCarreras"
                                option-label="nombre"
                                option-value="id"
                                label="Seleccionar Carrera"
                                outlined
                                use-input
                                input-debounce="300"
                                @filter="filterCarreras"
                                :disable="!selectedSede"
                                :rules="[val => !!val || 'Requerido']"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="school" />
                                </template>
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No se encontraron carreras
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <q-select
                                v-model="tipoContrato"
                                :options="['FACTURACION', 'RETENCION', 'AFILIACION']"
                                label="Tipo de Contrato"
                                outlined
                                :rules="[val => !!val || 'Requerido']"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="description" />
                                </template>
                            </q-select>
                        </div>

                        <div class="col-12 col-md-6">
                            <q-file
                                v-model="file"
                                label="Archivo Excel"
                                outlined
                                accept=".xlsx, .xls"
                                :rules="[val => !!val || 'Requerido']"
                                max-file-size="5242880"
                                @rejected="onFileRejected"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="attach_file" />
                                </template>
                                <template v-slot:hint>
                                    Tamaño máximo: 5MB
                                </template>
                            </q-file>
                        </div>
                    </div>

                    <q-banner class="bg-blue-1 text-blue-9 q-mt-md" rounded>
                        <template v-slot:avatar>
                            <q-icon name="info" color="blue" />
                        </template>
                        El archivo Excel debe contener las columnas: 1º APELLIDO, 2º APELLIDO, NOMBRE(S), CI, CARGA PAGADA, LIQUIDO PAGABLE
                    </q-banner>

                    <div class="q-mt-md">
                        <q-btn
                            type="submit"
                            label="Subir Datos"
                            color="primary"
                            icon="upload"
                            :loading="uploading"
                            :disable="!corteActivo"
                            unelevated
                            size="md"
                        />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
    name: 'UploadPage',
    setup() {
        const $q = useQuasar()
        const sedes = ref([])
        const cortes = ref([])
        const selectedSede = ref(null)
        const selectedCarrera = ref(null)
        const tipoContrato = ref(null)
        const file = ref(null)
        const uploading = ref(false)
        const allCarreras = ref([])
        const filteredCarreras = ref([])

        const corteActivo = computed(() => cortes.value.find(c => c.estado === 1))

        const loadSedes = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/sedes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                sedes.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar sedes' })
            }
        }

        const loadCortes = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/cortes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                cortes.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar cortes' })
            }
        }

        const loadCarrerasBySede = () => {
            selectedCarrera.value = null
            if (selectedSede.value) {
                allCarreras.value = selectedSede.value.sede_carreras?.map(sc => ({
                    id: sc.id,
                    nombre: sc.carrera?.nombre
                })) || []
                filteredCarreras.value = [...allCarreras.value]
            } else {
                allCarreras.value = []
                filteredCarreras.value = []
            }
        }

        const filterCarreras = (val, update) => {
            update(() => {
                if (val === '') {
                    filteredCarreras.value = allCarreras.value
                } else {
                    const needle = val.toLowerCase()
                    filteredCarreras.value = allCarreras.value.filter(
                        c => c.nombre.toLowerCase().indexOf(needle) > -1
                    )
                }
            })
        }

        const onFileRejected = () => {
            $q.notify({
                type: 'negative',
                message: 'Archivo rechazado. Verifique el formato y tamaño (máx 5MB)'
            })
        }

        const uploadExcel = async () => {
            if (!corteActivo.value) {
                $q.notify({ type: 'warning', message: 'No hay corte activo' })
                return
            }

            uploading.value = true
            try {
                const token = localStorage.getItem('token')
                const formData = new FormData()
                formData.append('file', file.value)
                formData.append('sede_carrera_id', selectedCarrera.value.id)
                formData.append('tipo_contrato', tipoContrato.value)

                await api.post('/facturaciones/upload-excel', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })

                $q.notify({ type: 'positive', message: 'Datos importados correctamente' })

                selectedSede.value = null
                selectedCarrera.value = null
                tipoContrato.value = null
                file.value = null
            } catch (error) {
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al importar datos'
                })
            } finally {
                uploading.value = false
            }
        }

        onMounted(() => {
            loadSedes()
            loadCortes()
        })

        return {
            sedes,
            cortes,
            selectedSede,
            selectedCarrera,
            tipoContrato,
            file,
            uploading,
            corteActivo,
            allCarreras,
            filteredCarreras,
            loadCarrerasBySede,
            filterCarreras,
            onFileRejected,
            uploadExcel
        }
    }
}
</script>
