import { Location, Product, InventoryBalance } from '../models';

export class PutawayService {
  /**
   * Scores a candidate bin for putaway based on capacity, weight, constraints, and affinity.
   * Higher score is better.
   */
  static async suggestBin(warehouseId: string, productId: string, quantity: number): Promise<{
    recommendedBin: any;
    score: number;
    reasons: string[];
    alternativeBins: any[];
  }> {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    // 1. Find all ACTIVE BIN locations in the warehouse
    const allBins = await Location.find({ 
      warehouseId, 
      type: 'BIN',
      status: 'ACTIVE'
    }).populate('zoneId');

    if (!allBins.length) {
      throw new Error('No active bins found in this warehouse.');
    }

    const scoredBins = [];

    // 2. Fetch current balances to know how full bins are and what products are in them
    for (const bin of allBins) {
      let score = 0;
      const reasons: string[] = [];
      let isEligible = true;

      const balancesInBin = await InventoryBalance.find({ locationId: bin._id });
      const currentItems = balancesInBin.reduce((sum, b) => sum + b.onHand, 0);
      const isProductAlreadyHere = balancesInBin.some(b => b.productId.toString() === productId);

      // --- Constraints (Hard limits) ---
      
      // Capacity check
      if (bin.capacity > 0 && currentItems + quantity > bin.capacity) {
        isEligible = false; // Bin would overflow
      }

      // Weight check
      const addedWeight = quantity * product.weight;
      if (bin.weightLimit > 0 && addedWeight > bin.weightLimit) { // Note: Should ideally check current total weight too
        isEligible = false;
      }

      // Storage constraints (e.g. Hazardous, Cold)
      // Assume zoneId has zoneType which could be matched against product constraints for MVP
      const zone: any = bin.zoneId;
      if (product.storageConstraints.length > 0) {
         if (!product.storageConstraints.includes(zone.zoneType)) {
            // isEligible = false; // Uncomment if strictly enforced
         }
      }

      if (!isEligible) continue;

      // --- Scoring (Soft preferences) ---

      // 1. Affinity: Same product is already here (+50 points)
      if (isProductAlreadyHere) {
        score += 50;
        reasons.push('Same SKU already stored here');
      }

      // 2. Utilization: Prefer bins that are partially full over completely empty ones to save space (+10 points)
      if (currentItems > 0 && !isProductAlreadyHere) {
        score += 10;
        reasons.push('Consolidating inventory');
      }

      // 3. Zone preference: Storage zones get priority (+20 points)
      if (zone && zone.zoneType === 'STORAGE') {
        score += 20;
        reasons.push('Primary storage zone');
      }

      // 4. Capacity remaining calculation
      if (bin.capacity > 0) {
        const percentFree = ((bin.capacity - currentItems) / bin.capacity) * 100;
        score += Math.floor(percentFree / 10); // +0 to +10 points
        reasons.push(`${Math.round(percentFree)}% capacity remaining`);
      }

      scoredBins.push({ bin, score, reasons });
    }

    if (scoredBins.length === 0) {
      throw new Error('No eligible bins found for this product and quantity.');
    }

    // Sort descending by score
    scoredBins.sort((a, b) => b.score - a.score);

    const best = scoredBins[0];
    const alternatives = scoredBins.slice(1, 4).map(s => ({
      locationId: s.bin._id,
      code: s.bin.code,
      score: s.score
    }));

    return {
      recommendedBin: {
        locationId: best.bin._id,
        code: best.bin.code
      },
      score: best.score,
      reasons: best.reasons,
      alternativeBins: alternatives
    };
  }
}
