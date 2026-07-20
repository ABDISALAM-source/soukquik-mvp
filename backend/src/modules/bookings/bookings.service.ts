import { Errors } from '../../common/errors';
import { servicesRepository } from '../services/services.repository';
import { notificationsService } from '../notifications/notifications.service';
import { availabilityService } from '../availability/availability.service';
import { bookingsRepository } from './bookings.repository';
import { CreateBookingInput } from './bookings.types';

export const bookingsService = {
  async create(clientId: string, input: CreateBookingInput) {
    const service = await servicesRepository.findById(input.serviceId);
    if (!service || !service.is_active) throw Errors.notFound('Service introuvable');
    if (input.scheduledAt) {
      const available = await availabilityService.isAvailableAt(service.provider_id, input.scheduledAt);
      if (!available) throw Errors.badRequest("Ce créneau n'est pas disponible");
    }
    return bookingsRepository.create(clientId, input.serviceId, input.scheduledAt, input.notes);
  },

  listMine(clientId: string) {
    return bookingsRepository.findByClient(clientId);
  },

  async listByService(serviceId: string, providerId: string) {
    const service = await servicesRepository.findById(serviceId);
    if (!service) throw Errors.notFound('Service introuvable');
    if (service.provider_id !== providerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce service");
    return bookingsRepository.findByService(serviceId);
  },

  async updateStatus(bookingId: string, providerId: string, status: string) {
    const booking = await bookingsRepository.findById(bookingId);
    if (!booking) throw Errors.notFound('Réservation introuvable');
    const service = await servicesRepository.findById(booking.service_id);
    if (!service || service.provider_id !== providerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce service");
    const updated = await bookingsRepository.updateStatus(bookingId, status);
    await notificationsService.create(booking.client_id, 'booking_status_changed', {
      bookingId,
      status,
      serviceId: service.id,
      serviceTitle: service.title,
    });
    return updated;
  },
};
