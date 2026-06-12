import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card } from '../components/ui';

export default function ItemEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin } = useAuth();

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    calories: '',
    ingredients: '',
    allergens: '',
    is_available: true,
  });

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [model, setModel] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: menuData } = useQuery({
    queryKey: ['menu', admin?.restaurant_id],
    queryFn: () => api.get(`/menu/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  const createCategory = useMutation({
    mutationFn: (name: string) => api.post('/menu/categories', { name, display_order: (menuData?.categories?.length || 0) + 1 }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu', admin?.restaurant_id] });
      setFormData(prev => ({ ...prev, category_id: data.data.id }));
      setIsCatModalOpen(false);
      setNewCatName('');
    },
  });

  useEffect(() => {
    if (isEditing && menuData?.items) {
      const item = menuData.items.find((i: any) => i.id === id);
      if (item) {
        setFormData({
          category_id: item.category_id,
          name: item.name,
          description: item.description,
          price: item.price.toString(),
          calories: item.calories?.toString() || '',
          ingredients: item.ingredients?.join(', ') || '',
          allergens: item.allergens?.join(', ') || '',
          is_available: item.is_available,
        });
      }
    } else if (menuData?.categories?.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: menuData.categories[0].id }));
    }
  }, [isEditing, id, menuData]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      };
      if (isEditing) {
        return api.put(`/menu/item/${id}`, data, config);
      } else {
        return api.post('/menu/item', data, config);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', admin?.restaurant_id] });
      navigate('/menu');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save item.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.category_id) {
      setError('Please select a category.');
      return;
    }

    if (!isEditing && !thumbnail) {
      setError('Thumbnail is required for new items.');
      return;
    }

    const payload = new FormData();
    payload.append('category_id', formData.category_id);
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('price', formData.price);
    
    if (formData.calories) payload.append('calories', formData.calories);
    
    // Parse comma separated to array
    const ingList = formData.ingredients.split(',').map(s => s.trim()).filter(Boolean);
    const allList = formData.allergens.split(',').map(s => s.trim()).filter(Boolean);
    
    ingList.forEach(ing => payload.append('ingredients[]', ing));
    allList.forEach(all => payload.append('allergens[]', all));
    
    payload.append('is_available', String(formData.is_available));

    if (thumbnail) payload.append('thumbnail', thumbnail);
    if (model) payload.append('model', model);

    saveMutation.mutate(payload);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/menu')}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-sora font-bold">{isEditing ? 'Edit Item' : 'New Item'}</h1>
          <p className="text-text-muted">Enter the details for your menu item.</p>
        </div>
      </div>

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
                onClick={(e) => {
                  e.preventDefault();
                  createCategory.mutate(newCatName);
                }}
                disabled={!newCatName.trim() || createCategory.isPending}
              >
                {createCategory.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-error/10 text-error rounded-10 border border-error/20">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text-primary block">Category</label>
                <button 
                  type="button"
                  onClick={() => setIsCatModalOpen(true)}
                  className="text-primary text-sm flex items-center gap-1 hover:underline font-medium"
                >
                  <Plus size={14} /> New Category
                </button>
              </div>
              <select 
                className="bg-surface border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-10 px-4 py-3 text-text-primary w-full transition-all duration-150"
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                <option value="" disabled>Select a category...</option>
                {menuData?.categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <Input 
              label="Item Name" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input 
              label="Price ($)" 
              type="number" 
              step="0.01"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              required
            />

            <div className="col-span-full">
              <label className="text-sm font-medium text-text-primary block mb-1.5">Description</label>
              <textarea 
                className="bg-surface border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-10 px-4 py-3 text-text-primary w-full min-h-[100px] transition-all duration-150 placeholder-text-muted"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <Input 
              label="Calories (optional)" 
              type="number"
              value={formData.calories}
              onChange={e => setFormData({ ...formData, calories: e.target.value })}
            />
            
            <div className="flex items-center gap-2 mt-8">
              <input 
                type="checkbox" 
                id="is_available"
                checked={formData.is_available}
                onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="is_available" className="text-sm font-medium">Currently Available</label>
            </div>

            <Input 
              label="Ingredients (comma separated)" 
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="Beef, Cheddar, Lettuce"
            />
            <Input 
              label="Allergens (comma separated)" 
              value={formData.allergens}
              onChange={e => setFormData({ ...formData, allergens: e.target.value })}
              placeholder="Dairy, Gluten"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary block">Thumbnail Image</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setThumbnail(e.target.files?.[0] || null)}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label htmlFor="thumbnail-upload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-border rounded-12 p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload size={18} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-muted">
                    {thumbnail ? thumbnail.name : (isEditing ? 'Upload new image (optional)' : 'Choose image...')}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary block">3D Model (.glb / optional)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".glb"
                  onChange={e => setModel(e.target.files?.[0] || null)}
                  className="hidden"
                  id="model-upload"
                />
                <label htmlFor="model-upload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-border rounded-12 p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload size={18} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-muted">
                    {model ? model.name : (isEditing ? 'Upload new model (optional)' : 'Choose .glb file...')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col pt-6 border-t border-border mt-8 gap-4">
            {saveMutation.isPending && uploadProgress > 0 && (
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saveMutation.isPending} className="flex items-center gap-2">
                <Save size={18} />
                {saveMutation.isPending ? `Saving (${uploadProgress}%)...` : 'Save Item'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
