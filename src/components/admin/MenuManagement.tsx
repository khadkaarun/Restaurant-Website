// Updated: 2025-07-29 16:30:16
// Updated: 2025-07-29 16:30:06
// Updated: 2025-07-29 16:30:00
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

interface MenuManagementProps {
  onStatsUpdate: () => void;
}

export function MenuManagement({ onStatsUpdate }: MenuManagementProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: 0,
    category_id: '',
    image_url: '',
    is_available: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase.from('menu_categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').order('name'),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setCategories(categoriesResult.data || []);
      setMenuItems(itemsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load menu data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .insert([categoryForm]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setCategoryForm({ name: '', sort_order: 0 });
      setShowAddCategoryDialog(false);
      fetchData();
      onStatsUpdate();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item added successfully",
      });

      resetForm();
      setShowAddDialog(false);
      fetchData();
      onStatsUpdate();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update(formData)
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });

      resetForm();
      setEditingItem(null);
      fetchData();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });

      fetchData();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_cents: 0,
      category_id: '',
      image_url: '',
      is_available: true,
    });
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price_cents: item.price_cents,
      category_id: item.category_id,
      image_url: item.image_url || '',
      is_available: item.is_available,
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <div className="flex gap-2">
          <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Menu Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Appetizers"
                  />
                </div>
                <div>
                  <Label htmlFor="sort-order">Sort Order</Label>
                  <Input
                    id="sort-order"
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={handleAddCategory} className="w-full">
                  Add Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
              </DialogHeader>
              <MenuItemForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={handleAddItem}
                onCancel={() => setShowAddDialog(false)}
                submitLabel="Add Item"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items ({menuItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryName(item.category_id)}</TableCell>
                  <TableCell>${(item.price_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_available ? "default" : "secondary"}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
            </DialogHeader>
            <MenuItemForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              onSubmit={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
              submitLabel="Update Item"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Separate form component for reusability
function MenuItemForm({ 
  formData, 
  setFormData, 
  categories, 
  onSubmit, 
  onCancel, 
  submitLabel 
}: {
  formData: any;
  setFormData: (data: any) => void;
  categories: MenuCategory[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Item name"
          />
        </div>
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={(formData.price_cents / 100).toFixed(2)}
            onChange={(e) => setFormData({ 
              ...formData, 
              price_cents: Math.round(parseFloat(e.target.value || '0') * 100)
            })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the item..."
          rows={3}
        />
      </div>

      <div>
        <Label>Image</Label>
        <ImageUpload
          itemName={formData.name || 'New Item'}
          currentImage={formData.image_url}
          onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="available"
          checked={formData.is_available}
          onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
        />
        <Label htmlFor="available">Available for order</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={onSubmit} className="flex-1">
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}