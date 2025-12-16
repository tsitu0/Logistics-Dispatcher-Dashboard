export const CONTAINER_STATUSES = [
  { id: "AT_TERMINAL", label: "At Terminal" },
  { id: "IN_TRANSIT_FROM_TERMINAL", label: "In Transit from Terminal" },
  { id: "ON_WAY_TO_CUSTOMER", label: "On the Way to Customer" },
  { id: "ON_WAY_TO_YARD", label: "On the Way to Yard" },
  { id: "AT_CUSTOMER_YARD", label: "At Customer Yard (Loaded)" },
  { id: "AT_OTHER_YARD", label: "Yards" },
  { id: "EMPTY_AT_CUSTOMER", label: "Empty at Customer" },
  { id: "RETURNING_TO_TERMINAL", label: "Returning to Terminal" },
  { id: "RETURNED", label: "Returned" },
] as const

export type ContainerStatusId = (typeof CONTAINER_STATUSES)[number]["id"]
