import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { bookingsService } from './bookings.service';
import { createBookingSchema, updateBookingStatusSchema } from './bookings.types';

export const bookingsController = {
  async create(req: Request, res: Response) {
    const input = createBookingSchema.parse(req.body);
    const booking = await bookingsService.create(req.user!.id, input);
    return ok(res, booking, 201);
  },

  async listMine(req: Request, res: Response) {
    const rows = await bookingsService.listMine(req.user!.id);
    return ok(res, rows);
  },

  async listByService(req: Request, res: Response) {
    const rows = await bookingsService.listByService(req.params.serviceId, req.user!.id);
    return ok(res, rows);
  },

  async updateStatus(req: Request, res: Response) {
    const input = updateBookingStatusSchema.parse(req.body);
    const booking = await bookingsService.updateStatus(req.params.id, req.user!.id, input.status);
    return ok(res, booking);
  },
};
