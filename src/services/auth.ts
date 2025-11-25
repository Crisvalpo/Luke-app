import { supabase } from '@/lib/supabase'
import { User, AuthResponse } from '@/types/user'

export async function signUp(userData: User): Promise<AuthResponse> {
    try {
        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.correo,
            password: userData.password!,
        })

        if (authError) {
            return {
                success: false,
                message: authError.message,
            }
        }

        if (!authData.user) {
            return {
                success: false,
                message: 'Error al crear usuario',
            }
        }

        // 2. Usar función de base de datos que bypasea RLS
        const { error: profileError } = await supabase.rpc('handle_new_user_profile', {
            user_id: authData.user.id,
            user_nombre: userData.nombre,
            user_rol: userData.rol,
            user_telefono: userData.telefono,
            user_correo: userData.correo,
        })

        if (profileError) {
            return {
                success: false,
                message: profileError.message,
            }
        }

        return {
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: authData.user.id,
                nombre: userData.nombre,
                rol: userData.rol,
                telefono: userData.telefono,
                correo: userData.correo,
            },
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error al registrar usuario',
        }
    }
}

export async function signIn(correo: string, password: string): Promise<AuthResponse> {
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: correo,
            password: password,
        })

        if (authError) {
            return {
                success: false,
                message: authError.message,
            }
        }

        // Obtener datos del perfil
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

        if (profileError) {
            return {
                success: false,
                message: profileError.message,
            }
        }

        return {
            success: true,
            message: 'Inicio de sesión exitoso',
            user: profileData,
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error al iniciar sesión',
        }
    }
}

export async function signOut(): Promise<AuthResponse> {
    try {
        const { error } = await supabase.auth.signOut()

        if (error) {
            return {
                success: false,
                message: error.message,
            }
        }

        return {
            success: true,
            message: 'Sesión cerrada exitosamente',
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error al cerrar sesión',
        }
    }
}

export async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return null
        }

        const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

        return profileData
    } catch (error) {
        return null
    }
}
