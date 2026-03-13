import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useRef } from "react";
import { compressImage } from "../utils/imageUtils";

interface ImageUploadProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  dataOcid?: string;
  maxDim?: number;
  size?: "sm" | "md" | "lg";
  fallback?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload Image",
  dataOcid,
  maxDim = 400,
  size = "md",
  fallback = "?",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, maxDim);
      onChange(compressed);
    } catch {
      console.error("Image compression failed");
    }
    e.target.value = "";
  }

  const avatarSize =
    size === "sm" ? "h-10 w-10" : size === "lg" ? "h-20 w-20" : "h-14 w-14";

  return (
    <div className="flex items-center gap-3">
      <Avatar className={avatarSize}>
        <AvatarImage src={value} />
        <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
          {fallback}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          data-ocid={dataOcid}
          className="border-border hover:border-primary text-sm"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {label}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-destructive px-2"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
