// Shared time slots definition for Sweety frontend
// Contains the database key and the human-readable UI label

export const SLOTS = [
  { key: 'morning', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

export const SLOT_LABELS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

export function getSlotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}
