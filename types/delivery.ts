export interface DeliveryAddressForm {
  address: string;
  address_name: string;
  delivery_instruction: string | null;
  detail_address: string | null;
  is_default: boolean | null;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
}
