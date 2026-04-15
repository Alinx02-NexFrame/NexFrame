import type { CargoInfo, BillingInfo } from '../types';

/**
 * Client-side billing calculation based on cargo data and pickup date.
 * This is a LOCAL-ONLY file — Figma Make does not generate it.
 * Used for dynamic pickup date recalculation without hitting the server.
 */
export function calculateBilling(cargo: CargoInfo, pickupDate?: string): BillingInfo {
  const arrivalDate = new Date(cargo.storageStartDate);
  const targetDate = pickupDate ? new Date(pickupDate) : new Date();
  const daysStored = Math.max(
    0,
    Math.floor((targetDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)) - cargo.freeTimeDays
  );
  const storageFee = daysStored > 0 ? daysStored * 50 * (cargo.weight / 1000) : 0;

  const serviceFee = 250.00;
  const otherCharge = cargo.customsStatus === 'Hold' ? 150.00 : 0;
  const subtotal = serviceFee + storageFee + otherCharge;
  const processingFee = subtotal * 0.025;

  return {
    awbNumber: cargo.awbNumber,
    serviceFee,
    storageFee,
    otherCharge,
    subtotal,
    processingFee,
    total: subtotal + processingFee,
  };
}
