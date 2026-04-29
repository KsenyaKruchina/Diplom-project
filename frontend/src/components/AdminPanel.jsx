// frontend/src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        fetchUsers(); // Обновляем список
      }
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
    }
  };

  if (!isAdmin) {
    return <div>Доступ запрещен. Требуются права администратора.</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Панель администратора</h1>
      <div className="admin-info">
        <h3>Текущий администратор: {user?.username}</h3>
      </div>
      
      <div className="users-list">
        <h2>Управление пользователями</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <select 
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;