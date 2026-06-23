export const getOrderBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
    case "credit":
      return "danger";
    default:
      return "default";
  }
};

export const getTableBadgeVariant = (status: string) => {
  switch (status) {
    case "available":
      return "success";
    case "occupied":
      return "danger";
    default:
      return "default";
  }
};

export const getProgramBadgeVariant = (status: string) => {
  switch (status) {
    case "available":
      return "success";
    case "not available":
      return "warning";
    default:
      return "default";
  }
};
