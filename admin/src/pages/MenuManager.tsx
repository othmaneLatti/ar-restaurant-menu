import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, DataTable, Input } from '../components/ui';
import { cn } from '../utils/cn';

export default function MenuManager() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu', admin?.restaurant_id],
    queryFn: () => api.get(`/menu/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', admin?.restaurant_id] });
    },
  });

  const toggleCat = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const createCategory = useMutation({
    mutationFn: (name: string) => api.post('/menu/categories', { name, display_order: categories.length + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', admin?.restaurant_id] });
      setIsCatModalOpen(false);
      setNewCatName('');
    },
  });

  if (isLoading) {
    return <div className="text-text-muted animate-pulse">Loading menu...</div>;
  }

  const categories = menuData?.categories || [];
  const allItems = menuData?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">Menu Manager</h1>
          <p className="text-text-muted">Manage your categories and interactive items.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCatModalOpen(true)} variant="ghost" className="flex items-center gap-2">
            <Plus size={18} />
            Add Category
          </Button>
          <Button onClick={() => navigate('/menu/new')} className="flex items-center gap-2">
            <Plus size={18} />
            Add Item
          </Button>
        </div>
      </header>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-sora font-bold mb-4">New Category</h2>
            <Input 
              label="Category Name" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)} 
              placeholder="e.g. Appetizers, Main Course..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setIsCatModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => createCategory.mutate(newCatName)}
                disabled={!newCatName.trim() || createCategory.isPending}
              >
                {createCategory.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((cat: any) => {
          const catItems = allItems.filter((item: any) => item.category_id === cat.id);
          const isExpanded = expandedCats[cat.id];

          return (
            <Card key={cat.id} className="p-0 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? <ChevronDown size={20} className="text-primary" /> : <ChevronRight size={20} className="text-text-muted" />}
                  <h2 className="text-xl font-sora font-bold">{cat.name}</h2>
                  <span className="bg-secondary px-3 py-1 rounded-full text-xs text-text-muted border border-border">
                    {catItems.length} items
                  </span>
                </div>
                <div className="text-sm text-text-muted">Order: {cat.display_order}</div>
              </button>

              {isExpanded && (
                <div className="border-t border-border bg-background/50 p-4">
                  {catItems.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">No items in this category.</div>
                  ) : (
                    <DataTable headers={['Item', 'Price', 'Calories', 'Status', 'Actions']}>
                      {catItems.map((item: any) => (
                        <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.thumbnail_url ? (
                                <img src={item.thumbnail_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-border">
                                  <ImageIcon size={16} className="text-text-muted" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-text-primary">{item.name}</div>
                                <div className="text-xs text-text-muted truncate max-w-[200px]">{item.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-text-primary">${Number(item.price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-text-muted">{item.calories || '-'} kcal</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-semibold border",
                              item.is_available 
                                ? "bg-success/10 text-success border-success/20" 
                                : "bg-error/10 text-error border-error/20"
                            )}>
                              {item.is_available ? 'Available' : 'Sold Out'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigate(`/menu/edit/${item.id}`)}
                                className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                    deleteItem.mutate(item.id);
                                  }
                                }}
                                className="p-2 text-text-muted hover:text-error transition-colors rounded-lg hover:bg-error/10"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
