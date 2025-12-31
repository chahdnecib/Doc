import { supabase } from './supabase';

export const appointmentService = {
  // 1. Récupérer les RDV d'aujourd'hui
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

  // 2. Récupérer les RDV futurs
  async getFutureAppointments(doctorId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .gt('appointment_date', todayStr)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 3. Mettre à jour le statut (C'est celle-ci qui lance la visio)
  async updateStatus(appointmentId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: status })
        .eq('id', appointmentId)
        .select(); // Garde bien le select() pour le Realtime
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Erreur service updateStatus:", error);
      return { data: null, error };
    }
  },

  // 4. Terminer un RDV (Corrigé pour notifier le patient)
  async completeAppointment(appointmentId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId)
      .select(); // AJOUTÉ : pour que le bouton vert disparaisse chez le patient

    if (error) throw error;
    return data;
  }
};