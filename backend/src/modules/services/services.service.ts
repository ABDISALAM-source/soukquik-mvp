import { Errors } from '../../common/errors';
import { analyticsRepository } from '../analytics/analytics.repository';
import { servicesRepository, mapService } from './services.repository';
import { CreateServiceInput, UpdateServiceInput } from './services.types';

async function assertOwner(serviceId: string, providerId: string) {
  const service = await servicesRepository.findById(serviceId);
  if (!service) throw Errors.notFound('Service introuvable');
  if (service.provider_id !== providerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce service");
  return service;
}

export const servicesService = {
  list(filters: { category?: string; q?: string; sort?: string }) {
    return servicesRepository.findAll(filters);
  },

  nearby(lat: number, lng: number, radiusKm: number, limit: number) {
    return servicesRepository.findNearby(lat, lng, radiusKm, limit);
  },

  async trending(limit: number) {
    const rows = await analyticsRepository.trendingServices(limit);
    return rows.map((r: any) => ({ ...mapService(r), recentBookings: r.recent_bookings, recentVisits: r.recent_visits }));
  },

  async getById(id: string) {
    const service = await servicesRepository.findById(id);
    if (!service) throw Errors.notFound('Service introuvable');
    return mapService(service);
  },

  create(providerId: string, input: CreateServiceInput) {
    return servicesRepository.create(providerId, input);
  },

  async update(id: string, providerId: string, input: UpdateServiceInput) {
    await assertOwner(id, providerId);
    return servicesRepository.update(id, input);
  },

  async remove(id: string, providerId: string) {
    await assertOwner(id, providerId);
    await servicesRepository.softDelete(id);
  },

  async analyticsMine(providerId: string) {
    const [base, visits] = await Promise.all([
      servicesRepository.analyticsForProvider(providerId),
      analyticsRepository.serviceVisitStats(providerId),
    ]);
    return { ...base, ...visits };
  },
};
