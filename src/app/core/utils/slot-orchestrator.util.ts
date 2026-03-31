import { HourlySlot } from '../models/infrastructure.model';

/**
 * Utility for handling atomic 1-hour time slots.
 * Ensures standardized matching between infrastructure availability and workshop sessions.
 */
export class SlotOrchestrator {
    private static readonly DAY_HOURS = Array.from({ length: 24 }, (_, i) => i);

    /**
     * Generates a standard set of 24 hourly slots for a day.
     * Default status is 'Closed'.
     */
    static generateStandardSlots(): HourlySlot[] {
        return this.DAY_HOURS.map(hour => {
            const startStr = hour.toString().padStart(2, '0') + ':00';
            const endHour = (hour + 1);
            const endStr = endHour === 24 ? '00:00' : endHour.toString().padStart(2, '0') + ':00';
            return {
                time: `${startStr}-${endStr}`,
                status: 'Closed',
                pricing: {
                    type: 'Free',
                    amount: 0,
                    unit: 'Hourly'
                }
            };
        });
    }

    /**
     * Detects consecutive sequences of available slots.
     * @param slots Full list of hourly slots
     * @param count Number of consecutive sessions required
     * @returns Array of starting indices for valid sequences
     */
    static findConsecutiveSequences(slots: HourlySlot[], count: number): number[] {
        if (count <= 0 || count > slots.length) return [];
        
        const startingIndices: number[] = [];
        for (let i = 0; i <= slots.length - count; i++) {
            let isConsecutive = true;
            for (let j = 0; j < count; j++) {
                if (slots[i + j].status !== 'Available') {
                    isConsecutive = false;
                    break;
                }
            }
            if (isConsecutive) {
                startingIndices.push(i);
            }
        }
        return startingIndices;
    }

    /**
     * Helper to map a time string (e.g., "14:00") to the slot index.
     */
    static getTimeIndex(time: string): number {
        const hour = parseInt(time.split(':')[0], 10);
        return isNaN(hour) ? -1 : hour;
    }

    /**
     * Gets the display label for a slot range.
     */
    static getSlotLabel(index: number): string {
        const slots = this.generateStandardSlots();
        return slots[index]?.time || 'Unknown Slot';
    }
}
