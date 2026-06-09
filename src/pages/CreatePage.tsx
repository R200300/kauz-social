import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fileToScaledDataUrl } from "@/lib/ai-image";
import { toast } from "sonner";

export default function CreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToScaledDataUrl(file);
    setImage(dataUrl);
  };

  const handlePost = async () => {
    if (!image || !user) return;
    setUploading(true);
    try {
      const filename = `post-${Date.now()}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(`${user.id}/${filename}`, image);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("posts").insert({
        user_id: user.id,
        caption,
        image_url: data.path,
      });
      if (dbError) throw dbError;

      toast.success("Post shared!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pb-20 pt-4 px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Post</h1>
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={24} />
        </button>
      </div>

      {image ? (
        <div className="space-y-4">
          <img src={image} alt="Preview" className="w-full rounded-lg" />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setImage(null)}
              className="flex-1 rounded-lg border border-border px-4 py-2"
            >
              Change image
            </button>
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              {uploading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 py-20 hover:border-primary hover:bg-primary/5">
          <Upload size={32} className="mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Tap to upload image</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}