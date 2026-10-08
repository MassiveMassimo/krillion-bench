import { syntheticDay } from "./fixtures.ts";

// Public preview data is explicit. Private run journals are never loaded here.
export const savedDays = [syntheticDay];
export const savedDates = savedDays.map((day) => day.question.date).toSorted();

export function getSavedDay(date: string) {
  return savedDays.find((day) => day.question.date === date);
}
