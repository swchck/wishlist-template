export const GIFT_TYPES = [
  "вещь",
  "впечатление",
  "навык",
  "услуга",
  "другое",
] as const;
export type GiftType = (typeof GIFT_TYPES)[number];

export const GIFT_TYPE_PLURAL: Record<GiftType, string> = {
  вещь: "Вещи",
  впечатление: "Впечатления",
  навык: "Навыки",
  услуга: "Услуги",
  другое: "Другое",
};
