import { createClient } from '@supabase/supabase-js'
import { IDataConnector } from '../interfaces'

export class SupabaseConnector implements IDataConnector {
    private supabase;
    private projectId: string;

    constructor(projectId: string) {
        this.projectId = projectId;
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const { data, error } = await this.supabase
                .from('proyectos')
                .select('id')
                .eq('id', this.projectId)
                .single();

            if (error) throw error;

            return { success: true, message: 'Conexión a Supabase exitosa' };
        } catch (error: any) {
            return { success: false, message: `Error de conexión: ${error.message}` };
        }
    }

    async getSpools(filters?: Record<string, any>): Promise<any[]> {
        let query = this.supabase
            .from('spools')
            .select(`
                *,
                isometrico:isometricos (
                    iso_number,
                    line_number,
                    revision
                ),
                juntas (
                    weld_number,
                    type_weld,
                    nps,
                    estado_inspeccion
                )
            `)
            .eq('proyecto_id', this.projectId);

        if (filters?.estado) {
            query = query.eq('estado', filters.estado);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Error al obtener spools: ${error.message}`);
        return data || [];
    }

    async getMateriales(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('materiales')
            .select(`
                *,
                spool:spools (
                    spool_tag,
                    spool_full_id
                )
            `)
            .eq('proyecto_id', this.projectId);

        if (error) throw new Error(`Error al obtener materiales: ${error.message}`);
        return data || [];
    }

    /**
     * Obtener isométricos del proyecto
     */
    async getIsometricos(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('isometricos')
            .select('*')
            .eq('proyecto_id', this.projectId)
            .order('iso_number');

        if (error) throw new Error(`Error al obtener isométricos: ${error.message}`);
        return data || [];
    }

    /**
     * Obtener válvulas del proyecto
     */
    async getValvulas(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('valvulas')
            .select(`
                *,
                isometrico:isometricos (
                    iso_number,
                    line_number
                )
            `)
            .eq('proyecto_id', this.projectId);

        if (error) throw new Error(`Error al obtener válvulas: ${error.message}`);
        return data || [];
    }

    /**
     * Obtener soportes del proyecto
     */
    async getSoportes(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('soportes')
            .select(`
                *,
                isometrico:isometricos (
                    iso_number,
                    line_number
                )
            `)
            .eq('proyecto_id', this.projectId);

        if (error) throw new Error(`Error al obtener soportes: ${error.message}`);
        return data || [];
    }
}
