// Example service file
import apiClient from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const response = await apiClient.post<User>('/users', user);
    return response.data;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, user);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
