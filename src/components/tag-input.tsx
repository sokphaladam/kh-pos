import { KeyboardEvent, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Props {
  tags: string[];
  setTags: (tags: string[]) => void;
  lock: string[];
  onDraftValue?: (e: string) => void;
  availableTags?: string[]; // Optional list of available tags to choose from
}

export default function TagsInput(props: Props) {
  const [inputValue, setInputValue] = useState("");
  const addTag = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && inputValue.trim()) {
      event.preventDefault();
      props.setTags([...props.tags, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeTag = useCallback(
    (tag: string) => {
      const dummy = props.tags.filter((f) => f !== tag);
      props.setTags(dummy);
    },
    [props]
  );

  // Filter out selected tags from available tags
  const filteredAvailableTags = props.availableTags
    ? props.availableTags.filter((tag) => !props.tags.includes(tag))
    : [];

  return (
    <div className="w-full space-y-3">
      {/* Input at the top with border */}
      <div className="border rounded-md">
        <Input
          type="text"
          placeholder="Press enter to add value"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            props.onDraftValue?.(e.target.value);
          }}
          onKeyDown={addTag}
          className="w-full text-xs h-[36px] focus-visible:ring-1 focus-visible:ring-offset-0"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      {/* Selected tags section */}
      {props.tags.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            Selected
          </div>
          <div className="flex flex-wrap gap-2">
            {props.tags.map((tag, index) => (
              <Badge
                key={index}
                className="flex items-center gap-1 px-2 py-1 text-xs"
                variant={"outline"}
              >
                {tag}
                <X
                  className={cn(
                    "w-3 h-3 cursor-pointer ml-1",
                    props.lock.includes(tag) ? "invisible" : "visible"
                  )}
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available tags section (filtered) */}
      {filteredAvailableTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filteredAvailableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (!props.tags.includes(tag)) {
                  props.setTags([...props.tags, tag]);
                }
              }}
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
