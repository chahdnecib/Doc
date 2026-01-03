import { supabase } from './supabase';

export const appointmentService = {
  // 1. Récupérer TOUT le planning à venir (Aujourd'hui + Futur)
  // C'est cette fonction qu'il faut utiliser pour l'affichage principal
  async getUpcomingAppointments(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', today) // gte = Greater Than or Equal (Aujourd'hui ou après)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 2. Récupérer uniquement aujourd'hui (Si vous voulez un onglet spécifique)
  async getTodayAppointments(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // 3. Récupérer uniquement le futur (Excluant aujourd'hui)
  async getFutureAppointments(doctorId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .gt('appointment_date', todayStr) // gt = Greater Than (Après aujourd'hui)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 4. Mettre à jour le statut (Lancer la consultation)
  async updateStatus(appointmentId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: status }) // Utilise le paramètre status passé (ex: 'in_progress')
        .eq('id', appointmentId)
        .select(); 
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Erreur service updateStatus:", error);
      return { data: null, error };
    }
  },

  // 5. Terminer un RDV
  async completeAppointment(appointmentId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId)
      .select(); 

    if (error) throw error;
    return data;
  }
};