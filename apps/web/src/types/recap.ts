export interface RecapStats {
  year: number;
  totalActivities: number;
  totalDistanceKm: number;
  totalElevationGainMeters: number;
  totalDurationHours: number;
  longestActivityDistanceKm: number;
  longestActivityName: string;
  longestActivityDate: string;
  fastestPaceSecondsPerKm: number | null;
  fastestPaceActivityName: string | null;
  longestStreakDays: number;
  mostActiveMonth: string;
  mostActiveMonthActivityCount: number;
  everestMultiple: number;
  sportBreakdown: Record<string, number>;
}
