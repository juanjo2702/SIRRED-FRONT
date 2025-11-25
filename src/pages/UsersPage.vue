<template>
    <q-page padding>
        <div class="q-mb-md">
            <div class="row justify-between items-center q-mb-md">
                <div class="text-h5 text-weight-medium">Gestión de Usuarios</div>
                <q-btn color="primary" label="Nuevo Usuario" icon="add" @click="showDialog = true" unelevated />
            </div>

            <q-input
                v-model="searchQuery"
                outlined
                dense
                placeholder="Buscar por nombre, apellidos o CI..."
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
            :rows="filteredUsers"
            :columns="columns"
            row-key="id"
            :loading="loading"
            flat
            bordered
            :rows-per-page-options="[10, 25, 50]"
            class="shadow-1"
        >
            <template v-slot:body-cell-status="props">
                <q-td :props="props">
                    <q-badge :color="props.row.status ? 'positive' : 'negative'">
                        {{ props.row.status ? 'Activo' : 'Inactivo' }}
                    </q-badge>
                </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                    <q-btn flat dense color="primary" icon="edit" @click="editUser(props.row)">
                        <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn flat dense color="warning" icon="lock_reset" @click="resetPassword(props.row)">
                        <q-tooltip>Restablecer Contraseña</q-tooltip>
                    </q-btn>
                    <q-btn flat dense :color="props.row.status ? 'negative' : 'positive'"
                        :icon="props.row.status ? 'block' : 'check_circle'" @click="toggleStatus(props.row)">
                        <q-tooltip>{{ props.row.status ? 'Desactivar' : 'Activar' }}</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="showDialog">
            <q-card style="min-width: 400px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">{{ editMode ? 'Editar Usuario' : 'Nuevo Usuario' }}</div>
                </q-card-section>

                <q-card-section>
                    <q-form @submit="saveUser">
                        <q-input v-model="form.name" label="Nombre" outlined dense class="q-mb-md"
                            :rules="[val => !!val || 'Requerido']" />
                        <q-input v-model="form.apellidos" label="Apellidos" outlined dense class="q-mb-md"
                            :rules="[val => !!val || 'Requerido']" />
                        <q-input v-model="form.ci" label="CI" outlined dense class="q-mb-md"
                            :rules="[val => !!val || 'Requerido']" />
                        <q-select
                            v-model="form.role_id"
                            :options="roles"
                            option-label="nombre"
                            option-value="id"
                            emit-value
                            map-options
                            label="Rol"
                            outlined
                            dense
                            class="q-mb-md"
                            :rules="[val => !!val || 'Requerido']"
                        />

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
    name: 'UsersPage',
    setup() {
        const $q = useQuasar()
        const users = ref([])
        const roles = ref([])
        const loading = ref(false)
        const saving = ref(false)
        const showDialog = ref(false)
        const editMode = ref(false)
        const form = ref({ name: '', apellidos: '', ci: '', role_id: null })
        const searchQuery = ref('')

        const columns = [
            { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
            { name: 'apellidos', label: 'Apellidos', field: 'apellidos', align: 'left', sortable: true },
            { name: 'ci', label: 'CI', field: 'ci', align: 'left', sortable: true },
            { name: 'role', label: 'Rol', field: row => row.role?.nombre, align: 'left', sortable: true },
            { name: 'status', label: 'Estado', field: 'status', align: 'center' },
            { name: 'actions', label: 'Acciones', align: 'center' }
        ]

        const filteredUsers = computed(() => {
            if (!searchQuery.value) return users.value

            const query = searchQuery.value.toLowerCase()
            return users.value.filter(user =>
                user.name?.toLowerCase().includes(query) ||
                user.apellidos?.toLowerCase().includes(query) ||
                user.ci?.toLowerCase().includes(query)
            )
        })

        const loadUsers = async () => {
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/users', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                users.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar usuarios' })
            } finally {
                loading.value = false
            }
        }

        const loadRoles = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await api.get('/roles', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                roles.value = response.data
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al cargar roles' })
            }
        }

        const saveUser = async () => {
            saving.value = true
            try {
                const token = localStorage.getItem('token')
                if (editMode.value) {
                    await api.put(`/users/${form.value.id}`, form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Usuario actualizado' })
                } else {
                    await api.post('/users', form.value, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Usuario creado' })
                }
                showDialog.value = false
                loadUsers()
                form.value = { name: '', apellidos: '', ci: '', role_id: null }
            } catch (error) {
                $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error al guardar' })
            } finally {
                saving.value = false
            }
        }

        const editUser = (user) => {
            form.value = { ...user }
            editMode.value = true
            showDialog.value = true
        }

        const resetPassword = async (user) => {
            $q.dialog({
                title: 'Confirmar',
                message: `¿Restablecer contraseña de ${user.name}?`,
                cancel: true
            }).onOk(async () => {
                try {
                    const token = localStorage.getItem('token')
                    await api.post(`/users/${user.id}/reset-password`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    $q.notify({ type: 'positive', message: 'Contraseña restablecida' })
                } catch (error) {
                    $q.notify({ type: 'negative', message: 'Error al restablecer contraseña' })
                }
            })
        }

        const toggleStatus = async (user) => {
            try {
                const token = localStorage.getItem('token')
                await api.post(`/users/${user.id}/toggle-status`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                $q.notify({ type: 'positive', message: 'Estado actualizado' })
                loadUsers()
            } catch (error) {
                $q.notify({ type: 'negative', message: 'Error al actualizar estado' })
            }
        }

        onMounted(() => {
            loadUsers()
            loadRoles()
        })

        return {
            users,
            roles,
            loading,
            saving,
            showDialog,
            editMode,
            form,
            columns,
            searchQuery,
            filteredUsers,
            saveUser,
            editUser,
            resetPassword,
            toggleStatus
        }
    }
}
</script>
