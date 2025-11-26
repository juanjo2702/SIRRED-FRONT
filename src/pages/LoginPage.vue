<template>
    <q-page class="flex flex-center login-page">
        <div class="login-container">
            <q-card class="login-card" flat bordered>
                <!-- Header with Logo -->
                <q-card-section class="text-center q-pt-xl q-pb-lg">
                    <div class="logo-container q-mb-md">
                        <q-icon name="school" size="64px" color="primary" />
                    </div>
                    <div class="text-h4 text-weight-bold text-primary q-mb-xs">SIRRED</div>
                    <div class="text-subtitle1 text-grey-7">Universidad Técnica Privada Cosmos</div>
                    <div class="text-caption text-grey-6">Sistema de Registro de Respaldos Docentes</div>
                </q-card-section>

                <q-separator />

                <!-- Login Form -->
                <q-card-section v-if="!forceChangePassword" class="q-pa-xl">
                    <div class="text-h6 text-weight-medium q-mb-md text-center">Iniciar Sesión</div>

                    <q-form @submit="login" class="q-gutter-md">
                        <q-input
                            v-model="ci"
                            label="Cédula de Identidad"
                            outlined
                            :rules="[val => !!val || 'CI es requerido']"
                        >
                            <template v-slot:prepend>
                                <q-icon name="badge" color="primary" />
                            </template>
                        </q-input>

                        <q-input
                            v-model="password"
                            label="Contraseña"
                            :type="showPassword ? 'text' : 'password'"
                            outlined
                            autocomplete="current-password"
                            :rules="[val => !!val || 'Contraseña es requerida']"
                        >
                            <template v-slot:prepend>
                                <q-icon name="lock" color="primary" />
                            </template>
                            <template v-slot:append>
                                <q-icon
                                    :name="showPassword ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer"
                                    @click="showPassword = !showPassword"
                                />
                            </template>
                        </q-input>

                        <q-btn
                            type="submit"
                            label="Iniciar Sesión"
                            color="primary"
                            size="lg"
                            class="full-width q-mt-md"
                            :loading="loading"
                            unelevated
                        />
                    </q-form>
                </q-card-section>

                <!-- Change Password Form -->
                <q-card-section v-else class="q-pa-xl">
                    <div class="text-center q-mb-md">
                        <q-icon name="lock_reset" size="48px" color="warning" />
                        <div class="text-h6 text-weight-medium q-mt-sm">Cambiar Contraseña</div>
                        <div class="text-caption text-grey-7">Por seguridad, debe cambiar su contraseña</div>
                    </div>

                    <q-form @submit="changePassword" class="q-gutter-md">
                        <q-input
                            v-model="newPassword"
                            label="Nueva Contraseña"
                            :type="showNewPassword ? 'text' : 'password'"
                            outlined
                            :rules="[
                                val => !!val || 'Contraseña es requerida',
                                val => val.length >= 6 || 'Mínimo 6 caracteres'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="vpn_key" color="primary" />
                            </template>
                            <template v-slot:append>
                                <q-icon
                                    :name="showNewPassword ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer"
                                    @click="showNewPassword = !showNewPassword"
                                />
                            </template>
                        </q-input>

                        <q-input
                            v-model="confirmPassword"
                            label="Confirmar Contraseña"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            outlined
                            :rules="[
                                val => !!val || 'Confirmación es requerida',
                                val => val === newPassword || 'Las contraseñas no coinciden'
                            ]"
                        >
                            <template v-slot:prepend>
                                <q-icon name="check_circle" color="primary" />
                            </template>
                            <template v-slot:append>
                                <q-icon
                                    :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer"
                                    @click="showConfirmPassword = !showConfirmPassword"
                                />
                            </template>
                        </q-input>

                        <q-btn
                            type="submit"
                            label="Cambiar Contraseña"
                            color="primary"
                            size="lg"
                            class="full-width q-mt-md"
                            :loading="loading"
                            unelevated
                        />
                    </q-form>
                </q-card-section>

                <!-- Footer -->
                <q-card-section class="text-center text-caption text-grey-6 q-pb-md">
                    © 2025 Universidad Técnica Privada Cosmos
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
    name: 'LoginPage',
    setup() {
        const $q = useQuasar()
        const router = useRouter()
        const ci = ref('')
        const password = ref('')
        const newPassword = ref('')
        const confirmPassword = ref('')
        const loading = ref(false)
        const forceChangePassword = ref(false)
        const tempToken = ref('')
        const showPassword = ref(false)
        const showNewPassword = ref(false)
        const showConfirmPassword = ref(false)

        const login = async () => {
            loading.value = true
            try {
                const response = await api.post('/login', {
                    ci: ci.value,
                    password: password.value
                })

                if (response.data.force_change_password) {
                    forceChangePassword.value = true
                    tempToken.value = response.data.access_token
                    $q.notify({
                        type: 'warning',
                        message: 'Debe cambiar su contraseña en el primer inicio de sesión'
                    })
                } else {
                    localStorage.setItem('token', response.data.access_token)
                    localStorage.setItem('user', JSON.stringify(response.data.user))
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
                    $q.notify({ type: 'positive', message: 'Bienvenido' })
                    router.push('/')
                }
            } catch (error) {
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al iniciar sesión'
                })
            } finally {
                loading.value = false
            }
        }

        const changePassword = async () => {
            loading.value = true
            try {
                await api.post('/change-password', {
                    password: newPassword.value,
                    password_confirmation: confirmPassword.value
                }, {
                    headers: { Authorization: `Bearer ${tempToken.value}` }
                })

                localStorage.setItem('token', tempToken.value)
                api.defaults.headers.common['Authorization'] = `Bearer ${tempToken.value}`
                $q.notify({ type: 'positive', message: 'Contraseña actualizada correctamente' })
                router.push('/')
            } catch (error) {
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al cambiar contraseña'
                })
            } finally {
                loading.value = false
            }
        }

        return {
            ci,
            password,
            newPassword,
            confirmPassword,
            loading,
            forceChangePassword,
            showPassword,
            showNewPassword,
            showConfirmPassword,
            login,
            changePassword
        }
    }
}
</script>

<style scoped>
.login-page {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.login-container {
    width: 100%;
    max-width: 480px;
    padding: 20px;
}

.login-card {
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.logo-container {
    animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.q-card__section {
    animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
