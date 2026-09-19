import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, buildQuery } from './client';
import type {
  Addon,
  Bill,
  BillFormat,
  Dashboard,
  MenuItem,
  Order,
  OrderHistory,
  OrderStatus,
  Profile,
  RestaurantTable,
  TableStatus,
} from './types';

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => api.get<Profile>('/profile') });

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<Dashboard>('/dashboard') });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api.get<string[]>('/menu/categories') });

export const useMenu = (filters: { category?: string; search?: string }) =>
  useQuery({
    queryKey: ['menu', filters],
    queryFn: () => api.get<MenuItem[]>(`/menu${buildQuery(filters)}`),
  });

export const useToggleMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      api.patch<MenuItem>(`/menu/${id}`, { available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu'] }),
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: { name: string; category: string; price: number; available: boolean }) =>
      api.post<MenuItem>('/menu', item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu'] }),
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(`/menu/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu'] }),
  });
};

export const useAddons = (search?: string) =>
  useQuery({
    queryKey: ['addons', search],
    queryFn: () => api.get<Addon[]>(`/addons${buildQuery({ search })}`),
  });

export const useCreateAddon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addon: { name: string; price: number; linkedDishes: string[] }) =>
      api.post<Addon>('/addons', addon),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addons'] }),
  });
};

export const useDeleteAddon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(`/addons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addons'] }),
  });
};

export const useOrders = () =>
  useQuery({ queryKey: ['orders'], queryFn: () => api.get<Order[]>('/orders') });

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch<Order>(`/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(`/orders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useTables = () =>
  useQuery({ queryKey: ['tables'], queryFn: () => api.get<RestaurantTable[]>('/tables') });

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      api.patch<RestaurantTable>(`/tables/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (table: { capacity: number }) => api.post<RestaurantTable>('/tables', table),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
};

export const useOrderHistory = (filters: { search?: string; status?: string }) =>
  useQuery({
    queryKey: ['order-history', filters],
    queryFn: () => api.get<OrderHistory>(`/order-history${buildQuery(filters)}`),
  });

export const useBill = (orderNo: string, format: BillFormat) =>
  useQuery({
    queryKey: ['bill', orderNo, format],
    queryFn: () => api.get<Bill>(`/bills/${encodeURIComponent(orderNo)}${buildQuery({ format })}`),
    enabled: Boolean(orderNo),
  });
