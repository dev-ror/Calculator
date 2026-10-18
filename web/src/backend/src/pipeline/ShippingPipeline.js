import { calculateShipping } from "../services/ShippingService.js";

export function execute(request) {
  return calculateShipping(request.shopId, request);
}
