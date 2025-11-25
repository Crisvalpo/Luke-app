export interface User {
    id?: string
    nombre: string
    rol: string
    telefono: string
    correo: string
    password?: string
    created_at?: string
}

export interface AuthResponse {
    success: boolean
    message: string
    user?: User
}
