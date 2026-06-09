import { useState } from "react";
import { X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function CreateStorySheet({ open, onClose, onStoryCreated }: { open: boolean; onClose: () => void; onStoryCreated?: () => void }) {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!image || !user) return;
    setLoading(true);
    try {
      // Upload image to storage
      const filename = `story-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from("stories")
        .upload(`${user.id}/${filename}`, image);
      if (error) throw error;

      // Create story record
      const { error: dbError } = await supabase.from("stories").insert({
        user_id: user.id,
        image_url: data.path,
      });
      if (dbError) throw dbError;

      toast.success("Story posted!");
      onStoryCreated?.();
      onClose();
      setImage(null);
    } catch (error) {
      toast.error("Failed to post story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all ${open ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Story</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {image ? (
          <img src={image} alt="Preview" className="w-full h-96 object-cover rounded-lg" />
        ) : (
          <label className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
            <Upload size={32} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Tap to upload</p>
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </label>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={handleUpload} disabled={!image || loading} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}