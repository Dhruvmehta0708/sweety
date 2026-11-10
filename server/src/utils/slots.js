// Shared time slots definition for Sweety
// Contains the database key and the human-readable UI label

const SLOTS = [
  { key: 'morning', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

const SLOT_KEYS = SLOTS.map((s) => s.key);

const SLOT_LABELS = SLOTS.reduce((acc, s) => {
  acc[s.key] = s.label;
  return acc;
}, {});

function isValidSlot(slot) {
  return SLOT_KEYS.includes(slot);
}

function getSlotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}

module.exports = {
  SLOTS,
  SLOT_KEYS,
  SLOT_LABELS,
  isValidSlot,
  getSlotLabel,
};
