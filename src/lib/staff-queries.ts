import { queryOptions } from "@tanstack/react-query";
import { staffSnapshot, ownerData } from "./staff-data.functions";
export { orderLines, type StaffOrder } from "./staff-order";
export const staffQuery = queryOptions({ queryKey: ["staff-orders"], queryFn: () => staffSnapshot(), refetchInterval: 15000 });
export const ownerQuery = queryOptions({ queryKey: ["owner-data"], queryFn: () => ownerData() });