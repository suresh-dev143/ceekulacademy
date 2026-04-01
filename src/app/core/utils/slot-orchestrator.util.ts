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
        if (!time || !time.includes(':')) return -1;
        const hour = parseInt(time.split(':')[0], 10);
        return isNaN(hour) ? -1 : hour;
    }

    /**
     * Checks if a specific slot range overlaps with a requested session range.
     * @param slotTime Slot in "HH:MM-HH:MM" format
     * @param startTime Requested start time in "HH:MM" format
     * @param endTime Requested end time in "HH:MM" format
     * @returns Boolean indicating overlap
     */
    static isOverlapping(slotTime: string, startTime: string, endTime: string): boolean {
        if (!startTime || !endTime) return true; // Permissive if times not yet defined
        
        const [slotStartS, slotEndS] = slotTime.split('-');
        
        const toMin = (t: string) => {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        };
        
        const sStart = toMin(slotStartS);
        const sEnd = toMin(slotEndS === '00:00' ? '24:00' : slotEndS);
        const rStart = toMin(startTime);
        const rEnd = toMin(endTime);
        
        return Math.max(sStart, rStart) < Math.min(sEnd, rEnd);
    }

    /**
     * Gets the display label for a slot range.
     */
    static getSlotLabel(index: number): string {
        const slots = this.generateStandardSlots();
        return slots[index]?.time || 'Unknown Slot';
    }
}
