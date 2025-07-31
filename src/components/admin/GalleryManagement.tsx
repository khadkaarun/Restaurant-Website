// Updated: 2025-07-29 16:30:21
// Updated: 2025-07-29 16:30:12
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import MediaUpload from '@/components/MediaUpload';

interface GalleryItem {
  id: string;
  image_url: string;
  caption?: string;
  type: 'image' | 'video';
  created_at: string;
}

interface GalleryManagementProps {
  onStatsUpdate: () => void;
}

export function GalleryManagement({ onStatsUpdate }: GalleryManagementProps) {
  const { toast } = useToast();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
    type: 'image' as 'image' | 'video',
  });

  const handleMediaUploaded = (url: string, type: 'image' | 'video') => {
    setFormData({ ...formData, image_url: url, type });
  };

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGalleryItems((data || []) as GalleryItem[]);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gallery item added successfully",
      });

      setFormData({
        image_url: '',
        caption: '',
        type: 'image',
      });
      setShowAddDialog(false);
      fetchGalleryItems();
      onStatsUpdate();
    } catch (error) {
      console.error('Error adding gallery item:', error);
      toast({
        title: "Error",
        description: "Failed to add gallery item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;

    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gallery item deleted successfully",
      });

      fetchGalleryItems();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      toast({
        title: "Error",
        description: "Failed to delete gallery item",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gallery Management</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gallery Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Gallery Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'image' | 'video') => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Upload {formData.type === 'image' ? 'Image' : 'Video'}
                </Label>
                <MediaUpload
                  itemName={`gallery-item-${Date.now()}`}
                  onMediaUploaded={handleMediaUploaded}
                  currentMedia={formData.image_url}
                  currentType={formData.type}
                  allowedTypes={['image', 'video']}
                />
              </div>

              <div>
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Add a caption..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddItem} className="flex-1">
                  Add Item
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative">
              {item.type === 'image' ? (
                <img
                  src={item.image_url}
                  alt={item.caption || 'Gallery item'}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={item.image_url}
                  className="w-full h-48 object-cover"
                  controls
                  preload="metadata"
                />
              )}
              <div className="absolute top-2 left-2">
                {item.type === 'image' ? (
                  <ImageIcon className="h-4 w-4 text-white bg-black/50 rounded p-1" />
                ) : (
                  <Video className="h-4 w-4 text-white bg-black/50 rounded p-1" />
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleDeleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {item.caption || 'No caption'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Added {new Date(item.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {galleryItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No gallery items</h3>
            <p className="text-muted-foreground mb-4">
              Add your first image or video to get started.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Gallery Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}