import { Errors } from '../../common/errors';
import { availabilityRepository } from './availability.repository';
import { CreateRuleInput, CreateExceptionInput } from './availability.types';

export const availabilityService = {
  async listMine(providerId: string) {
    const [rules, exceptions] = await Promise.all([
      availabilityRepository.findRulesByProvider(providerId),
      availabilityRepository.findExceptionsByProvider(providerId),
    ]);
    return { rules, exceptions };
  },

  createRule(providerId: string, input: CreateRuleInput) {
    if (input.startTime >= input.endTime) throw Errors.badRequest("L'heure de fin doit être après l'heure de début");
    return availabilityRepository.createRule(providerId, input);
  },

  async deleteRule(id: string, providerId: string) {
    const rule = await availabilityRepository.findRuleById(id);
    if (!rule) throw Errors.notFound('Règle introuvable');
    if (rule.provider_id !== providerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette règle");
    await availabilityRepository.deleteRule(id);
  },

  createException(providerId: string, input: CreateExceptionInput) {
    if (!input.isClosed) {
      if (!input.startTime || !input.endTime || input.startTime >= input.endTime) {
        throw Errors.badRequest("Horaire invalide pour cette exception (fournir startTime < endTime, ou isClosed: true)");
      }
    }
    return availabilityRepository.upsertException(providerId, input);
  },

  async deleteException(id: string, providerId: string) {
    const exception = await availabilityRepository.findExceptionById(id);
    if (!exception) throw Errors.notFound('Exception introuvable');
    if (exception.provider_id !== providerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette exception");
    await availabilityRepository.deleteException(id);
  },

  resolveForDate(providerId: string, date: string) {
    // Convention JS Date#getUTCDay() : 0=dimanche ... 6=samedi, cohérent
    // avec le CHECK (weekday BETWEEN 0 AND 6) de la migration.
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return availabilityRepository.resolveForDate(providerId, date, weekday);
  },

  async isAvailableAt(providerId: string, isoDateTime: string) {
    const dt = new Date(isoDateTime);
    const date = dt.toISOString().slice(0, 10);
    const weekday = dt.getUTCDay();
    const timeStr = `${dt.toISOString().slice(11, 16)}:00`;
    const resolved = await availabilityRepository.resolveForDate(providerId, date, weekday);
    if (!resolved.hasAnyRule) return true;
    if (resolved.closed) return false;
    return resolved.windows.some((w) => timeStr >= w.startTime && timeStr < w.endTime);
  },
};
